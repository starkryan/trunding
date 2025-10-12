import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    // Get session using Better Auth
    const session = await auth.api.getSession({
      headers: await headers()
    })

    // If no session, try to get user from database for testing
    let userId = session?.session?.userId

    if (!userId) {
      // For testing purposes, get a user from database
      const testUser = await prisma.user.findFirst({
        where: {
          email: {
            contains: "@", // Get any user with an email
          }
        }
      })

      if (!testUser) {
        return NextResponse.json(
          { success: false, error: "No user found for testing" },
          { status: 401 }
        )
      }

      userId = testUser.id
      console.log("Using test user:", testUser.email)
    }

    // Parse request body
    const body = await request.json()
    const { serviceId, amount, serviceName, providerName } = body

    if (!serviceId || !amount || !serviceName) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      )
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    // Prepare payment request data
    const paymentRequest = {
      userId,
      amount: parseFloat(amount),
      currency: "INR",
      serviceId,
      serviceName,
      customerName: user.name || 'Test User',
      customerMobile: "9876543210",
      returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/home?payment_success=true`,
      webhookUrl: process.env.WEBHOOK_URL || "http://localhost:3001/api/payment/webhook",
    }

    // Use payment service directly without API route wrapper
    const { paymentService } = await import("@/lib/payment-service")

    // Get active payment providers
    const activeProviders = await paymentService.getActiveProviders()

    if (activeProviders.length === 0) {
      return NextResponse.json(
        { success: false, error: "No payment providers are currently available" },
        { status: 503 }
      )
    }

    // Determine which provider to use
    let selectedProvider = activeProviders[0]

    // If a specific provider is requested, use it if it's available
    if (providerName) {
      const requestedProvider = activeProviders.find(p =>
        p.name.toLowerCase() === providerName.toLowerCase()
      )

      if (requestedProvider) {
        selectedProvider = requestedProvider
      }
    }

    console.log(`Creating test payment with ${selectedProvider.name}:`, {
      userId,
      amount,
      serviceId,
      serviceName,
      provider: selectedProvider.name,
    })

    // Create payment using the selected provider
    const paymentResponse = await paymentService.createPayment(
      selectedProvider.name,
      paymentRequest
    )

    if (!paymentResponse.success) {
      console.error(`Test payment creation failed with ${selectedProvider.name}:`, paymentResponse.error)
      return NextResponse.json(
        {
          success: false,
          error: paymentResponse.error || `Failed to create payment with ${selectedProvider.name}`,
          details: paymentResponse.details,
          provider: selectedProvider.name
        },
        { status: 400 }
      )
    }

    // Use database transaction to ensure atomic operation
    const result = await prisma.$transaction(async (tx) => {
      // Ensure wallet exists for the user
      const wallet = await tx.wallet.upsert({
        where: { userId: userId },
        update: {},
        create: {
          userId: userId,
          balance: 0,
          currency: "INR",
        },
      })

      // Store payment details in database
      const payment = await tx.payment.create({
        data: {
          userId: userId,
          amount: parseFloat(amount),
          currency: "INR",
          status: "PENDING",
          provider: selectedProvider.name,
          providerOrderId: paymentResponse.orderId,
          paymentUrl: paymentResponse.paymentUrl,
          phone: paymentRequest.customerMobile,
          rewardServiceId: serviceId,
          metadata: {
            serviceId: serviceId,
            serviceName: serviceName,
            providerResponse: paymentResponse.details,
            customerName: user.name,
            customerEmail: user.email,
            testMode: true,
          },
        },
      })

      return payment
    })

    console.log(`Test payment record created: ${result.id} with provider: ${selectedProvider.name}`)

    // Generate custom payment URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001"
    const customPaymentUrl = `${baseUrl}/payment/${paymentResponse.orderId}`

    return NextResponse.json({
      success: true,
      paymentUrl: customPaymentUrl,
      orderId: paymentResponse.orderId,
      paymentId: result.id,
      transactionId: paymentResponse.transactionId,
      provider: selectedProvider.name,
      testMode: true,
      availableProviders: activeProviders.map(p => ({
        name: p.name,
        enabled: p.isActive
      }))
    })

  } catch (error) {
    console.error("Test payment creation error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error", details: String(error) },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.session?.userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
          message: "This test endpoint requires authentication or will use first available user from database"
        },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Test payment endpoint is working",
      user: {
        id: session.session.userId,
        email: session.user.email,
        name: session.user.name
      }
    })

  } catch (error) {
    console.error("Test payment endpoint error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}