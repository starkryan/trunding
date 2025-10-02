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
        status: "PENDING", // Only redirect pending payments
      },
    })

    if (!payment) {
      return NextResponse.json(
        { success: false, error: "Payment not found or already processed" },
        { status: 404 }
      )
    }

    if (!payment.paymentUrl) {
      return NextResponse.json(
        { success: false, error: "Payment URL not available" },
        { status: 400 }
      )
    }

    // Perform server-side redirect to Kukupay
    // This completely hides the Kukupay URL from the client
    return NextResponse.redirect(payment.paymentUrl, 302)
  } catch (error) {
    console.error("Error redirecting to payment:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
