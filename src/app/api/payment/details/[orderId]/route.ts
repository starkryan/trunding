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
      select: {
        id: true,
        paymentUrl: true,
        amount: true,
        currency: true,
        status: true,
        providerOrderId: true,
        createdAt: true,
        completedAt: true,
      },
    })

    if (!payment) {
      return NextResponse.json(
        { success: false, error: "Payment not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        paymentUrl: payment.paymentUrl,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        orderId: payment.providerOrderId,
        createdAt: payment.createdAt,
        completedAt: payment.completedAt,
      },
    })
  } catch (error) {
    console.error("Error fetching payment details:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
