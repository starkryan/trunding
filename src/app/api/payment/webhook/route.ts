import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { ReferralService } from "@/lib/referral-service"
import { RewardService } from "@/lib/reward-service"

export async function POST(request: NextRequest) {
  try {
    // Kukupay sends URL-encoded form data, not JSON
    const body = await request.text()
    console.log("Received Kukupay webhook raw:", body)

    // Parse URL-encoded data
    const params = new URLSearchParams(body)
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
        console.log("Parsed JSON data from webhook:", parsedData)
      } catch (error) {
        console.error("Failed to parse JSON data from webhook:", error)
        // Fall back to original data if JSON parsing fails
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
      console.error("Webhook missing order_id")
      return NextResponse.json(
        { success: false, error: "Missing order_id" },
        { status: 400 }
      )
    }

    // Find the payment record by provider order ID
    const payment = await prisma.payment.findFirst({
      where: {
        providerOrderId: order_id,
      },
      include: {
        user: true,
        wallet: true,
        rewardService: true,
      },
    })

    if (!payment) {
      console.error("Payment not found for order_id:", order_id)
      return NextResponse.json(
        { success: false, error: "Payment not found" },
        { status: 404 }
      )
    }

    // Update payment status based on webhook
    let paymentStatus: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED" | "REFUNDED" = "PENDING"
    let transactionType: "DEPOSIT" | "WITHDRAWAL" | "TRADE_BUY" | "TRADE_SELL" | "REWARD" | "REFUND" = "DEPOSIT"
    let transactionDescription = ""

    // Kukupay sends status as numeric (200 for success)
    if (status === "success" || status === "completed" || status === 200 || status === "200") {
      paymentStatus = "COMPLETED"
      transactionDescription = `Payment completed for order ${order_id}`
    } else if (status === "failed" || status === "failure") {
      paymentStatus = "FAILED"
      transactionType = "REFUND"
      transactionDescription = `Payment failed for order ${order_id}`
    } else if (status === "cancelled" || status === "cancel") {
      paymentStatus = "CANCELLED"
      transactionType = "REFUND"
      transactionDescription = `Payment cancelled for order ${order_id}`
    }

    // Update payment record
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: paymentStatus,
        webhookReceived: true,
        metadata: {
          ...(payment.metadata as Record<string, any> || {}),
          webhookData: parsedData,
          transactionId: transaction_id,
          paymentId: payment_id,
        },
        completedAt: paymentStatus === "COMPLETED" ? new Date() : null,
      },
    })

    // If payment is completed, update wallet and create transaction
    if (paymentStatus === "COMPLETED") {
      // Check if this is a reward service payment
      if (payment.rewardServiceId) {
        console.log(`Processing reward service payment: ${payment.rewardService?.name}`)
        try {
          // Use RewardService to handle reward service payouts
          await RewardService.processRewardServicePayout(
            payment.userId,
            payment.amount,
            payment.id
          )
          console.log(`Reward service payout completed for user ${payment.userId}, payment: ${payment.id}`)
        } catch (rewardError) {
          console.error("Error processing reward service payout:", rewardError)
          // Don't fail the payment if reward processing fails
        }
      } else {
        // Regular payment processing (non-reward service)
        // Update or create wallet
        let wallet = payment.wallet
        if (!wallet) {
          wallet = await prisma.wallet.create({
            data: {
              userId: payment.userId,
              balance: 0,
              currency: payment.currency,
            },
          })
        }

        // Update wallet balance
        await prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: {
              increment: payment.amount,
            },
          },
        })

        // Create transaction record
        await prisma.transaction.create({
          data: {
            userId: payment.userId,
            walletId: wallet.id,
            amount: payment.amount,
            currency: payment.currency,
            type: transactionType,
            status: "COMPLETED",
            description: transactionDescription,
            referenceId: payment.id,
            metadata: {
              paymentId: payment.id,
              providerOrderId: order_id,
              transactionId: transaction_id,
            },
          },
        })

        console.log(`Regular payment completed for user ${payment.userId}, amount: ${payment.amount}`)

        // Process referral rewards if applicable (only for regular deposits, not reward services)
        try {
          await ReferralService.processReferralReward(payment.userId, payment.amount)
          console.log(`Referral reward processed for user ${payment.userId}`)
        } catch (referralError) {
          console.error("Error processing referral reward:", referralError)
          // Don't fail the payment if referral processing fails
        }
      }
    } else if (paymentStatus === "FAILED" || paymentStatus === "CANCELLED") {
      // Create failed transaction record for tracking
      if (payment.wallet) {
        await prisma.transaction.create({
          data: {
            userId: payment.userId,
            walletId: payment.wallet.id,
            amount: payment.amount,
            currency: payment.currency,
            type: transactionType,
            status: "FAILED",
            description: transactionDescription,
            referenceId: payment.id,
            metadata: {
              paymentId: payment.id,
              providerOrderId: order_id,
              transactionId: transaction_id,
            },
          },
        })
      }
    }

    console.log(`Webhook processed successfully for order ${order_id}`)

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
    })
  } catch (error) {
    console.error("Webhook processing error:", error)
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
    message: "Kukupay webhook endpoint is active",
  })
}
