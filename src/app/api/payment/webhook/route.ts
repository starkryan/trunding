import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ReferralService } from "@/lib/referral-service"
import { RewardService } from "@/lib/reward-service"
import {
  WebhookLogger,
  WebhookSignatureValidator,
  WebhookRetryManager,
  WebhookDeliveryTracker,
  extractWebhookSignature,
  isDuplicateWebhook,
  validateWebhookPayload,
} from "@/lib/webhook-utils"

interface Pay0WebhookData {
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'CANCELLED'
  order_id: string
  customer_mobile?: string
  amount?: string
  remark1?: string
  remark2?: string
}

async function processWebhookDataWithLock(
  provider: string,
  data: {
    order_id: string
    status: string | number
    amount?: string | number
    transaction_id?: string
    payment_id?: string
    rawData: any
  }
): Promise<NextResponse> {
  try {
    console.log(`Processing ${provider} webhook with atomic lock:`, data)

    return await prisma.$transaction(async (tx) => {
      // Lock the payment row for the duration of this transaction
      const lockedPayments = await tx.$queryRaw<Array<any>>`
        SELECT * FROM "Payment"
        WHERE "providerOrderId" = ${data.order_id}
        AND "provider" = ${provider}
        FOR UPDATE
      `;

      if (!lockedPayments || lockedPayments.length === 0) {
        console.error(`${provider} payment not found for order_id:`, data.order_id)
        return NextResponse.json(
          { success: false, error: "Payment not found" },
          { status: 404 }
        );
      }

      const payment = lockedPayments[0];

      // CRITICAL RACE CONDITION FIX: Check if payment is already processed within the locked transaction
      if (payment.status === 'COMPLETED') {
        if (payment.rewardServiceId && payment.rewardsProcessed) {
          console.log(`Duplicate webhook detected within locked transaction: payment ${payment.id} already completed with rewards processed`);
          return NextResponse.json({
            success: true,
            message: "Duplicate webhook ignored - payment already completed with rewards processed",
            duplicate: true
          });
        }
        if (!payment.rewardServiceId) {
          console.log(`Duplicate webhook detected within locked transaction: payment ${payment.id} already completed`);
          return NextResponse.json({
            success: true,
            message: "Duplicate webhook ignored - payment already completed",
            duplicate: true
          });
        }
      }

      // Find related data within the same transaction
      const user = await tx.user.findUnique({
        where: { id: payment.userId }
      });

      const wallet = await tx.wallet.findUnique({
        where: { userId: payment.userId }
      });

      const rewardService = payment.rewardServiceId
        ? await tx.rewardService.findUnique({
            where: { id: payment.rewardServiceId }
          })
        : null;

      if (!user) {
        console.error(`User not found for payment: ${payment.id}`);
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      // Update payment status based on webhook
      let paymentStatus: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED" | "REFUNDED" = "PENDING"
      let transactionType: "DEPOSIT" | "WITHDRAWAL" | "REWARD" | "REFERRAL" | "REFUND" = "DEPOSIT"
      let transactionDescription = ""

      // Map status based on provider
      if (provider === 'KUKUPAY') {
        // Kukupay sends status as numeric (200 for success) or string
        if (data.status === "success" || data.status === "completed" || data.status === 200 || data.status === "200") {
          paymentStatus = "COMPLETED"
          transactionDescription = `Payment completed for order ${data.order_id}`
        } else if (data.status === "failed" || data.status === "failure") {
          paymentStatus = "FAILED"
          transactionType = "REFUND"
          transactionDescription = `Payment failed for order ${data.order_id}`
        } else if (data.status === "cancelled" || data.status === "cancel") {
          paymentStatus = "CANCELLED"
          transactionType = "REFUND"
          transactionDescription = `Payment cancelled for order ${data.order_id}`
        }
      } else if (provider === 'PAY0') {
        // Pay0 sends status as string
        const statusStr = String(data.status).toUpperCase()
        if (statusStr === "SUCCESS") {
          paymentStatus = "COMPLETED"
          transactionDescription = `Payment completed for order ${data.order_id}`
        } else if (statusStr === "FAILED") {
          paymentStatus = "FAILED"
          transactionType = "REFUND"
          transactionDescription = `Payment failed for order ${data.order_id}`
        } else if (statusStr === "CANCELLED") {
          paymentStatus = "CANCELLED"
          transactionType = "REFUND"
          transactionDescription = `Payment cancelled for order ${data.order_id}`
        }
      }

      // Update payment record within the locked transaction
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: paymentStatus,
          webhookReceived: true,
          metadata: {
            ...(payment.metadata as Record<string, any> || {}),
            webhookData: data.rawData,
            transactionId: data.transaction_id,
            paymentId: data.payment_id,
          },
          completedAt: paymentStatus === "COMPLETED" ? new Date() : null,
        },
      })

      // If payment is completed, update wallet and create transaction within the same locked transaction
      if (paymentStatus === "COMPLETED") {
        // Check if this is a reward service payment
        if (payment.rewardServiceId) {
          console.log(`Processing reward service payment: ${rewardService?.name}`)

          // CRITICAL FIX: Check if rewards were already processed for this payment (within locked context)
          if (!payment.rewardsProcessed) {
            try {
              // Create or find wallet within the same transaction
              let paymentWallet = wallet;
              if (!paymentWallet) {
                paymentWallet = await tx.wallet.create({
                  data: {
                    userId: user.id,
                    balance: 0,
                    currency: payment.currency,
                  },
                });
              }

              // Calculate reward amount using the reward service formula
              const rewardAmount = RewardService.calculateRewardAmount(rewardService!.formula, payment.amount);
              const totalAmount = payment.amount + rewardAmount;

              console.log(`Processing reward service payout:
                - Payment Amount: ₹${payment.amount}
                - Formula: ${rewardService!.formula}
                - Reward Amount: ₹${rewardAmount}
                - Total Amount: ₹${totalAmount}
                - User ID: ${user.id}
                - Service: ${rewardService!.name}`);

              // Update wallet balance within the transaction
              await tx.wallet.update({
                where: { id: paymentWallet.id },
                data: {
                  balance: {
                    increment: totalAmount,
                  },
                },
              });

              // Create transaction record for the deposit within the transaction
              await tx.transaction.create({
                data: {
                  userId: user.id,
                  walletId: paymentWallet.id,
                  amount: payment.amount,
                  currency: paymentWallet.currency,
                  type: "DEPOSIT",
                  status: "COMPLETED",
                  description: `Deposit for ${rewardService!.name}`,
                  metadata: {
                    paymentId: payment.id,
                    rewardServiceId: rewardService!.id,
                    serviceType: "reward_service_deposit",
                  },
                },
              });

              // Create transaction record for the reward within the transaction
              if (rewardAmount > 0) {
                await tx.transaction.create({
                  data: {
                    userId: user.id,
                    walletId: paymentWallet.id,
                    amount: rewardAmount,
                    currency: paymentWallet.currency,
                    type: "REWARD",
                    status: "COMPLETED",
                    description: `Reward from ${rewardService!.name}`,
                    metadata: {
                      paymentId: payment.id,
                      rewardServiceId: rewardService!.id,
                      serviceType: "reward_service_bonus",
                      formula: rewardService!.formula,
                      formulaDisplay: rewardService!.formulaDisplay,
                    },
                  },
                });
              }

              // Mark rewards as processed within the same transaction
              await tx.payment.update({
                where: { id: payment.id },
                data: { rewardsProcessed: true }
              });

              console.log(`Reward service payout completed for user ${user.id}, payment: ${payment.id}`);
            } catch (rewardError) {
              console.error("Error processing reward service payout:", rewardError);
              throw rewardError; // Let the transaction roll back
            }
          } else {
            console.log(`Rewards already processed for payment ${payment.id}, skipping duplicate payout`);
          }
        } else {
          // Regular payment processing (non-reward service) within the same transaction
          // Create or find wallet
          let regularWallet = wallet;
          if (!regularWallet) {
            regularWallet = await tx.wallet.create({
              data: {
                userId: user.id,
                balance: 0,
                currency: payment.currency,
              },
            });
          }

          // Update wallet balance within the transaction
          await tx.wallet.update({
            where: { id: regularWallet.id },
            data: {
              balance: {
                increment: payment.amount,
              },
            },
          });

          // Create transaction record within the transaction
          await tx.transaction.create({
            data: {
              userId: user.id,
              walletId: regularWallet.id,
              amount: payment.amount,
              currency: regularWallet.currency,
              type: transactionType,
              status: "COMPLETED",
              description: transactionDescription,
              referenceId: payment.id,
              metadata: {
                paymentId: payment.id,
                providerOrderId: data.order_id,
                transactionId: data.transaction_id,
                provider: provider,
              },
            },
          });

          console.log(`Regular payment completed for user ${user.id}, amount: ${payment.amount}, provider: ${provider}`);

          // Process referral rewards if applicable (only for regular deposits, not reward services)
          try {
            await ReferralService.processReferralReward(user.id, payment.amount);
            console.log(`Referral reward processed for user ${user.id}`);
          } catch (referralError) {
            console.error("Error processing referral reward:", referralError);
          }
        }
      } else if (paymentStatus === "FAILED" || paymentStatus === "CANCELLED") {
        // Create failed transaction record for tracking within the transaction
        if (wallet) {
          await tx.transaction.create({
            data: {
              userId: user.id,
              walletId: wallet.id,
              amount: payment.amount,
              currency: payment.currency,
              type: transactionType,
              status: "FAILED",
              description: transactionDescription,
              referenceId: payment.id,
              metadata: {
                paymentId: payment.id,
                providerOrderId: data.order_id,
                transactionId: data.transaction_id,
                provider: provider,
              },
            },
          });
        }
      }

      await WebhookLogger.logWebhookProcessed(provider, data.order_id, {
        status: paymentStatus,
        amount: payment.amount,
        walletUpdated: paymentStatus === "COMPLETED",
        transactionCreated: paymentStatus === "COMPLETED"
      });

      return NextResponse.json({
        success: true,
        message: `${provider} webhook processed successfully with atomic lock`,
      });
    });
  } catch (error) {
    console.error(`${provider} webhook processing error with atomic lock:`, error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || ""

    if (contentType.includes("application/x-www-form-urlencoded")) {
      // Read the body once to determine the provider
      const body = await request.text()
      const params = new URLSearchParams(body)

      // Check for Pay0 specific fields
      if (params.has('status') && params.has('order_id') && params.has('customer_mobile')) {
        // Likely Pay0 webhook
        console.log("Detected Pay0 webhook")

        // Extract and validate signature from headers
        const signature = extractWebhookSignature(request, 'PAY0')

        if (signature) {
          const isValidSignature = WebhookSignatureValidator.validatePay0Signature(body, signature)
          if (!isValidSignature) {
            await WebhookLogger.logWebhookError('PAY0', 'unknown', 'Invalid webhook signature')
            return NextResponse.json(
              { success: false, error: "Invalid signature" },
              { status: 401 }
            )
          }
        }

        // Parse the body directly
        let webhookData: Pay0WebhookData
        try {
          const parsedData = new URLSearchParams(body)
          const data: any = {}

          for (const [key, value] of parsedData.entries()) {
            data[key] = value
          }

          webhookData = {
            status: data.status as 'SUCCESS' | 'PENDING' | 'FAILED' | 'CANCELLED',
            order_id: data.order_id,
            customer_mobile: data.customer_mobile,
            amount: data.amount,
            remark1: data.remark1,
            remark2: data.remark2,
          }
        } catch (parseError) {
          console.error("Failed to parse Pay0 webhook:", parseError)
          await WebhookLogger.logWebhookError('PAY0', 'unknown', 'Failed to parse webhook data')
          return NextResponse.json(
            { success: false, error: "Failed to parse webhook data" },
            { status: 400 }
          )
        }

        // Validate payload structure
        const payloadValidation = validateWebhookPayload(webhookData, 'PAY0')
        if (!payloadValidation.valid) {
          await WebhookLogger.logWebhookError('PAY0', webhookData.order_id, payloadValidation.error!)
          return NextResponse.json(
            { success: false, error: payloadValidation.error },
            { status: 400 }
          )
        }

        // Check for duplicate webhook
        const isDuplicate = await isDuplicateWebhook(webhookData.order_id, 'PAY0', webhookData)
        if (isDuplicate) {
          await WebhookLogger.logWebhookReceived('PAY0', webhookData.order_id, {
            duplicate: true,
            message: 'Duplicate webhook detected, ignoring'
          })
          return NextResponse.json({
            success: true,
            message: "Duplicate webhook ignored",
            duplicate: true
          })
        }

        // Mark webhook as received
        await WebhookDeliveryTracker.markWebhookReceived(webhookData.order_id, 'PAY0')
        await WebhookLogger.logWebhookReceived('PAY0', webhookData.order_id, {
          status: webhookData.status,
          amount: webhookData.amount
        })

        return await WebhookRetryManager.retryWithBackoff(
          () => processWebhookDataWithLock('PAY0', {
            order_id: webhookData.order_id,
            status: webhookData.status,
            amount: webhookData.amount,
            transaction_id: undefined, // Pay0 doesn't provide transaction_id in webhook
            payment_id: undefined,
            rawData: webhookData
          }),
          'PAY0',
          webhookData.order_id
        )
      } else {
        // Likely Kukupay webhook
        console.log("Detected Kukupay webhook")

        // Kukupay sends URL-encoded form data, not JSON
        console.log("Received Kukupay webhook raw:", body)

        // Parse URL-encoded data
        const webhookData: any = {}
        for (const [key, value] of params.entries()) {
          webhookData[key] = value
        }

        console.log("Parsed Kukupay webhook:", webhookData)

        // If the data is a JSON string in the 'data' parameter, parse it
        let parsedData = webhookData
        if (webhookData.data && typeof webhookData.data === 'string') {
          try {
            parsedData = JSON.parse(webhookData.data)
            console.log("Parsed JSON data from Kukupay webhook:", parsedData)
          } catch (error) {
            console.error("Failed to parse JSON data from Kukupay webhook:", error)
            parsedData = webhookData
          }
        }

        // Extract relevant data from webhook
        const {
          order_id,
          status,
          amount,
          transaction_id,
          payment_id
        } = parsedData

        if (!order_id) {
          console.error("Kukupay webhook missing order_id")
          return NextResponse.json(
            { success: false, error: "Missing order_id" },
            { status: 400 }
          )
        }

        return await processWebhookDataWithLock('KUKUPAY', {
          order_id,
          status,
          amount,
          transaction_id,
          payment_id,
          rawData: parsedData
        })
      }
    } else {
      // Default to treating as Kukupay for backward compatibility
      console.log("Defaulting to Kukupay webhook handler")
      return NextResponse.json(
        { success: false, error: "Unsupported content type" },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Webhook routing error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Handle GET requests for testing (optional)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Payment webhook endpoint is active - supports KUKUPAY and PAY0",
    supportedProviders: ["KUKUPAY", "PAY0"]
  })
}