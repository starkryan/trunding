import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

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

    // Extract relevant data from webhook
    const {
      order_id,
      status,
      amount,
      transaction_id,
      payment_id
    } = webhookData

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

    if (status === "success" || status === "completed") {
      paymentStatus = "COMPLETED"
      transactionDescription = `Payment completed for order ${order_id}`
    } else if (status === "failed") {
      paymentStatus = "FAILED"
      transactionType = "REFUND"
      transactionDescription = `Payment failed for order ${order_id}`
    } else if (status === "cancelled") {
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
          webhookData: webhookData,
          transactionId: transaction_id,
          paymentId: payment_id,
        },
        completedAt: paymentStatus === "COMPLETED" ? new Date() : null,
      },
    })

    // If payment is completed, update wallet and create transaction
    if (paymentStatus === "COMPLETED") {
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

      console.log(`Payment completed for user ${payment.userId}, amount: ${payment.amount}`)
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
