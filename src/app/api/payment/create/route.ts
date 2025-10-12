import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { paymentService } from "@/lib/payment-service"

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated using modern Better Auth pattern
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.session?.userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    // Get user details from the session directly
    const userId = session.session.userId

    // Parse request body
    const body = await request.json()
    const { serviceId, amount, serviceName, providerName } = body

    if (!serviceId || !amount || !serviceName) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      )
    }

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
      } else {
        return NextResponse.json(
          {
            success: false,
            error: `Payment provider ${providerName} is not available`,
            availableProviders: activeProviders.map(p => p.name)
          },
          { status: 400 }
        )
      }
    }

    // Get user details for payment
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

    // Prepare URLs
    const webhookUrl = process.env.WEBHOOK_URL || "http://localhost:3000/api/payment/webhook"
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || "http://localhost:3000"
    const returnUrl = `${baseUrl}/home?payment_success=true`

    // Prepare payment request data
    const paymentRequest = {
      userId,
      amount: parseFloat(amount),
      currency: "INR",
      serviceId,
      serviceName,
      customerName: user.name || 'User',
      customerMobile: "9876543210", // In production, get from user profile
      returnUrl,
      webhookUrl,
    }

    console.log(`Creating payment with ${selectedProvider.name}:`, {
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
      console.error(`Payment creation failed with ${selectedProvider.name}:`, paymentResponse.error)
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

    // Check for recent duplicate payment attempts from same user
    const recentPayment = await prisma.payment.findFirst({
      where: {
        userId: userId,
        amount: parseFloat(amount),
        rewardServiceId: serviceId,
        status: 'PENDING',
        createdAt: {
          gte: new Date(Date.now() - 2000) // Last 2 seconds
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (recentPayment) {
      // If there's a recent pending payment with same details, return it instead of creating a new one
      console.log('Found recent duplicate payment attempt, returning existing payment:', recentPayment.id)

      return NextResponse.json({
        success: true,
        paymentUrl: `${baseUrl}/payment/${recentPayment.providerOrderId}`,
        orderId: recentPayment.providerOrderId,
        paymentId: recentPayment.id,
        transactionId: recentPayment.metadata && typeof recentPayment.metadata === 'object' ?
          (recentPayment.metadata as any).transactionId : undefined,
        provider: recentPayment.provider,
        duplicatePrevented: true,
        availableProviders: activeProviders.map(p => ({
          name: p.name,
          enabled: p.isActive
        }))
      })
    }

    // Use database transaction to ensure atomic operation
    const result = await prisma.$transaction(async (tx) => {
      // Ensure wallet exists for the user using upsert operation
      const wallet = await tx.wallet.upsert({
        where: { userId: userId },
        update: {}, // No update needed if wallet exists
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
          rewardServiceId: serviceId, // Set reward service ID if this is a reward service payment
          metadata: {
            serviceId: serviceId,
            serviceName: serviceName,
            providerResponse: paymentResponse.details,
            customerName: user.name,
            customerEmail: user.email,
            clientTimestamp: Date.now(), // Track when request was made
          },
        },
      })

      return payment
    })

    console.log(`Payment record created: ${result.id} with provider: ${selectedProvider.name}`)

    // Generate custom payment URL that hides the provider URL
    const customPaymentUrl = `${baseUrl}/payment/${paymentResponse.orderId}`

    return NextResponse.json({
      success: true,
      paymentUrl: customPaymentUrl,
      orderId: paymentResponse.orderId,
      paymentId: result.id,
      transactionId: paymentResponse.transactionId,
      provider: selectedProvider.name,
      availableProviders: activeProviders.map(p => ({
        name: p.name,
        enabled: p.isActive
      }))
    })

  } catch (error) {
    console.error("Payment creation error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}