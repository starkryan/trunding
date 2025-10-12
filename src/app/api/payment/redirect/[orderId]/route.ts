import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { DeviceBindingService } from "@/lib/device-binding"
import { TokenRotationService } from "@/lib/token-rotation"

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
      include: {
        user: {
          select: {
            id: true,
            email: true,
          }
        }
      }
    })

    if (!payment) {
      return NextResponse.json(
        { success: false, error: "Payment not found" },
        { status: 404 }
      )
    }

    // Check if user is authenticated
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    // Enhanced authentication with device binding and token rotation
    const isSessionValid = await TokenRotationService.isSessionActive(request)
    const deviceValidation = await DeviceBindingService.validateDeviceBinding(request)

    // Create device binding for payment flow
    if (session?.user) {
      await DeviceBindingService.createDeviceBinding(
        session.user.id,
        request,
        true // isPaymentFlow
      )

      // Create extended session tokens for payment
      await TokenRotationService.createSessionTokens(
        session.user.id,
        request,
        true, // isPaymentSession
        30 * 60 * 1000 // 30 minutes expiry for payment flows
      )
    }

    // Check if device is trusted for payments
    const isTrustedDevice = await DeviceBindingService.isTrustedPaymentDevice(request)

    // Create response with enhanced security headers for mobile payment flows
    const createSecureRedirect = async (url: string, additionalData: Record<string, string> = {}) => {
      const redirectUrl = new URL(url, request.url)

      // Add additional query parameters
      Object.entries(additionalData).forEach(([key, value]) => {
        redirectUrl.searchParams.set(key, value)
      })

      const response = NextResponse.redirect(redirectUrl, 302)

      // Enhanced security headers for mobile payment flows
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('X-Content-Type-Options', 'nosniff')
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

      // Device binding and session security headers
      response.headers.set('X-Device-Binding-Valid', deviceValidation.isValid.toString())
      response.headers.set('X-Trusted-Device', isTrustedDevice.toString())
      response.headers.set('X-Session-Token-Valid', isSessionValid.toString())

      // Set secure session cookies for payment flow
      if (session && session.user) {
        // Extend session for payment flow
        response.headers.set('X-Payment-Session-Active', 'true')
        response.headers.set('X-Payment-User-Id', session.user.id)

        // Update payment activity for device binding
        await DeviceBindingService.updatePaymentActivity(request)
      }

      return response
    }

    // If payment is completed, redirect to transactions page with session recovery
    if (payment.status === "COMPLETED") {
      const recoveryData = {
        payment_success: "true",
        order_id: orderId,
        timestamp: Date.now().toString(),
        // Add session recovery token if user was authenticated
        ...(session?.user && {
          session_recovery: Buffer.from(`${session.user.id}:${Date.now()}`).toString('base64')
        })
      }

      return await createSecureRedirect("/transactions", recoveryData)
    }

    // If payment is pending and has a payment URL, redirect to payment provider
    if (payment.status === "PENDING" && payment.paymentUrl) {
      // Store payment state for recovery
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          // Store last activity timestamp
          updatedAt: new Date(),
        }
      })

      // Create payment-specific redirect URL with return parameters
      const paymentReturnUrl = new URL('/payment/' + orderId, request.url)
      paymentReturnUrl.searchParams.set('flow', 'mobile')
      paymentReturnUrl.searchParams.set('timestamp', Date.now().toString())

      // If user is authenticated, include session info
      if (session?.user) {
        paymentReturnUrl.searchParams.set('session_id', session.session.token)
      }

      // Create enhanced payment redirect
      const response = NextResponse.redirect(payment.paymentUrl, 302)

      // Set mobile payment specific headers
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      response.headers.set('X-Payment-Flow', 'mobile')
      response.headers.set('X-Payment-Order-Id', orderId)
      response.headers.set('X-Payment-Return-Url', paymentReturnUrl.toString())

      // Store payment context in secure cookie
      if (payment.userId) {
        response.headers.set('Set-Cookie',
          `payment_context=${orderId}:${Date.now()}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`
        )
      }

      return response
    }

    // For failed or cancelled payments, redirect to transactions with error
    if (payment.status === "FAILED" || payment.status === "CANCELLED") {
      const errorData = {
        payment_error: "true",
        order_id: orderId,
        status: payment.status,
        timestamp: Date.now().toString(),
        // Include session recovery if available
        ...(session?.user && {
          session_recovery: Buffer.from(`${session.user.id}:${Date.now()}`).toString('base64')
        })
      }

      return await createSecureRedirect("/transactions", errorData)
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
