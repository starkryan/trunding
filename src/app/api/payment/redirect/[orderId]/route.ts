import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      )
    }

    // Find payment by provider order ID
    const payment = await prisma.payment.findFirst({
      where: {
        providerOrderId: orderId,
      },
    })

    if (!payment) {
      return NextResponse.json(
        { success: false, error: "Payment not found" },
        { status: 404 }
      )
    }

    // If payment is completed, redirect to transactions page
    if (payment.status === "COMPLETED") {
      return NextResponse.redirect(
        new URL("/transactions?payment_success=true&order_id=" + orderId, request.url),
        302
      )
    }

    // If payment is pending and has a payment URL, redirect to payment provider
    if (payment.status === "PENDING" && payment.paymentUrl) {
      // Perform server-side redirect to Kukupay
      // This completely hides the Kukupay URL from the client
      return NextResponse.redirect(payment.paymentUrl, 302)
    }

    // For failed or cancelled payments, redirect to transactions with error
    if (payment.status === "FAILED" || payment.status === "CANCELLED") {
      return NextResponse.redirect(
        new URL(`/transactions?payment_error=true&order_id=${orderId}&status=${payment.status}`, request.url),
        302
      )
    }

    return NextResponse.json(
      { success: false, error: "Payment URL not available" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Error redirecting to payment:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
