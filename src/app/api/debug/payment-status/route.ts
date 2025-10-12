import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { paymentService } from "@/lib/payment-service"

export async function GET(request: NextRequest) {
  try {
    // Get session using Better Auth
    const session = await auth.api.getSession({
      headers: await headers()
    })

    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      session: null,
      users: null,
      payments: null,
      paymentProviders: null,
      adminSettings: null,
      environment: {
        WEBHOOK_URL: process.env.WEBHOOK_URL,
        NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
        PAY0_API_KEY: !!process.env.PAY0_API_KEY,
        KUKUPAY_API_KEY: !!process.env.KUKUPAY_API_KEY,
      }
    }

    // Add session info if available
    if (session?.session?.userId) {
      debugInfo.session = {
        userId: session.session.userId,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role
      }
    }

    // Get users from database
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    })
    debugInfo.users = users

    // Get recent payments
    const payments = await prisma.payment.findMany({
      select: {
        id: true,
        userId: true,
        amount: true,
        currency: true,
        status: true,
        provider: true,
        providerOrderId: true,
        createdAt: true,
        completedAt: true,
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    })
    debugInfo.payments = payments

    // Get admin settings for payment providers
    const adminSettings = await prisma.adminSettings.findFirst({
      where: { key: 'payment_providers' },
    })

    if (adminSettings?.value) {
      debugInfo.adminSettings = adminSettings.value
    }

    // Get active payment providers
    try {
      const activeProviders = await paymentService.getActiveProviders()
      debugInfo.paymentProviders = activeProviders.map(p => ({
        name: p.name,
        isActive: p.isActive
      }))
    } catch (error) {
      debugInfo.paymentProviders = {
        error: String(error)
      }
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo
    })

  } catch (error) {
    console.error("Debug endpoint error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: String(error)
      },
      { status: 500 }
    )
  }
}