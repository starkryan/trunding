import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { PaymentSessionRecovery } from "@/lib/payment-session-recovery"
import { auth } from "@/lib/auth"
import { DeviceBindingService } from "@/lib/device-binding"
import { TokenRotationService } from "@/lib/token-rotation"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params

  // Handle mobile payment flow session recovery
  const url = new URL(request.url)
  const isMobileFlow = url.searchParams.get('flow') === 'mobile'
  const sessionRecovery = url.searchParams.get('session_recovery')

  // Check for mobile payment return and attempt session recovery
  if (isMobileFlow || sessionRecovery) {
    const mobileReturn = await PaymentSessionRecovery.handleMobileAppReturn(request)

    if (mobileReturn.recoveredSession) {
      console.log('Session recovered for mobile payment flow')
    }
  }

  // Enhanced authentication with device binding and token rotation
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  // Validate device binding and tokens
  const deviceValidation = await DeviceBindingService.validateDeviceBinding(request)
  const tokenValidation = await TokenRotationService.validateAndRefreshTokens(request)
  const isTrustedDevice = await DeviceBindingService.isTrustedPaymentDevice(request)

  if (session?.user && tokenValidation.valid) {
    // Extend session for payment flows
    await PaymentSessionRecovery.extendPaymentSession(request)

    // Store payment context for recovery
    await PaymentSessionRecovery.storePaymentContext({
      orderId,
      userId: session.user.id,
      timestamp: Date.now().toString(),
      flow: isMobileFlow ? 'mobile' : 'web',
      sessionId: session.session.token,
      paymentStartTime: Date.now(),
    })

    // Update payment activity for device binding
    await DeviceBindingService.updatePaymentActivity(request)

    // Extend payment session if needed
    if (isMobileFlow) {
      await TokenRotationService.extendPaymentSession(request)
    }
  }

  // Create Server-Sent Events response
  const encoder = new TextEncoder()
  let streamClosed = false

  const safeClose = (controller: ReadableStreamDefaultController) => {
    if (!streamClosed) {
      streamClosed = true
      try {
        controller.close()
      } catch (error) {
        // Controller already closed, ignore error
        console.debug('Controller already closed:', error)
      }
    }
  }

  const response = new NextResponse(
    new ReadableStream({
      async start(controller) {
        try {
          let payment: any = null
          let pollInterval: NodeJS.Timeout | null = null

          // Send initial status
          payment = await prisma.payment.findFirst({
            where: { providerOrderId: orderId },
            select: {
              id: true,
              status: true,
              amount: true,
              currency: true,
              createdAt: true,
              completedAt: true,
              webhookReceived: true,
            },
          })

          if (payment) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'status',
              data: {
                status: payment.status,
                amount: payment.amount,
                currency: payment.currency,
                createdAt: payment.createdAt,
                completedAt: payment.completedAt,
                webhookReceived: payment.webhookReceived,
              }
            })}\n\n`))

            // If payment is already completed or failed, close the connection
            if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(payment.status)) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'complete',
                data: { status: payment.status }
              })}\n\n`))
              safeClose(controller)
              return
            }
          }

          // Set up polling interval to check for status changes
          pollInterval = setInterval(async () => {
            if (streamClosed) {
              if (pollInterval) clearInterval(pollInterval)
              return
            }

            try {
              const updatedPayment = await prisma.payment.findFirst({
                where: { providerOrderId: orderId },
                select: {
                  id: true,
                  status: true,
                  amount: true,
                  currency: true,
                  createdAt: true,
                  completedAt: true,
                  webhookReceived: true,
                },
              })

              if (updatedPayment) {
                const statusChanged = payment?.status !== updatedPayment.status
                const webhookReceived = updatedPayment.webhookReceived && !payment?.webhookReceived

                if (statusChanged || webhookReceived) {
                  payment = updatedPayment // Update payment reference
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    type: 'status',
                    data: {
                      status: updatedPayment.status,
                      amount: updatedPayment.amount,
                      currency: updatedPayment.currency,
                      createdAt: updatedPayment.createdAt,
                      completedAt: updatedPayment.completedAt,
                      webhookReceived: updatedPayment.webhookReceived,
                    }
                  })}\n\n`))

                  // If payment reached final state, close the connection
                  if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(updatedPayment.status)) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                      type: 'complete',
                      data: { status: updatedPayment.status }
                    })}\n\n`))
                    if (pollInterval) clearInterval(pollInterval)
                    safeClose(controller)
                    return
                  }
                }
              } else {
                // Payment not found, close connection
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  type: 'error',
                  data: { message: 'Payment not found' }
                })}\n\n`))
                if (pollInterval) clearInterval(pollInterval)
                safeClose(controller)
                return
              }
            } catch (error) {
              console.error('Error polling payment status:', error)
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'error',
                data: { message: 'Error checking payment status' }
              })}\n\n`))
            }
          }, 2000) // Poll every 2 seconds

          // Clean up interval when connection closes
          request.signal.addEventListener('abort', () => {
            if (pollInterval) clearInterval(pollInterval)
            safeClose(controller)
          })

          // Timeout after 15 minutes
          const timeoutId = setTimeout(() => {
            if (pollInterval) clearInterval(pollInterval)
            if (!streamClosed) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'timeout',
                data: { message: 'Status check timeout' }
              })}\n\n`))
              safeClose(controller)
            }
          }, 15 * 60 * 1000)

          // Clean up timeout on close
          request.signal.addEventListener('abort', () => {
            clearTimeout(timeoutId)
          })

        } catch (error) {
          console.error('SSE stream error:', error)
          if (!streamClosed) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              data: { message: 'Stream error' }
            })}\n\n`))
            safeClose(controller)
          }
        }
      },
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        // Mobile payment flow specific headers
        ...(isMobileFlow && {
          'X-Payment-Flow': 'mobile',
          'X-Session-Recovery': sessionRecovery || 'none',
          'X-Payment-Timestamp': Date.now().toString(),
        }),
        // Enhanced security and session status headers
        ...(session?.user && {
          'X-User-Authenticated': 'true',
          'X-User-Id': session.user.id,
        }),
        // Device binding and token validation status
        'X-Device-Binding-Valid': deviceValidation.isValid.toString(),
        'X-Trusted-Device': isTrustedDevice.toString(),
        'X-Token-Validation-Valid': tokenValidation.valid.toString(),
        'X-Token-Refreshed': (tokenValidation.refreshed || false).toString(),
        // Session security metrics
        'X-Session-Security-Level': isTrustedDevice && tokenValidation.valid ? 'high' :
                                  tokenValidation.valid ? 'medium' : 'low',
      },
    }
  )

  return response
}