import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params

  // Create Server-Sent Events response
  const response = new NextResponse(
    new ReadableStream({
      async start(controller) {
        try {
          // Send initial status
          const payment = await prisma.payment.findFirst({
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
            controller.enqueue(`data: ${JSON.stringify({
              type: 'status',
              data: {
                status: payment.status,
                amount: payment.amount,
                currency: payment.currency,
                createdAt: payment.createdAt,
                completedAt: payment.completedAt,
                webhookReceived: payment.webhookReceived,
              }
            })}\n\n`)

            // If payment is already completed or failed, close the connection
            if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(payment.status)) {
              controller.enqueue(`data: ${JSON.stringify({
                type: 'complete',
                data: { status: payment.status }
              })}\n\n`)
              controller.close()
              return
            }
          }

          // Set up polling interval to check for status changes
          const pollInterval = setInterval(async () => {
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
                  controller.enqueue(`data: ${JSON.stringify({
                    type: 'status',
                    data: {
                      status: updatedPayment.status,
                      amount: updatedPayment.amount,
                      currency: updatedPayment.currency,
                      createdAt: updatedPayment.createdAt,
                      completedAt: updatedPayment.completedAt,
                      webhookReceived: updatedPayment.webhookReceived,
                    }
                  })}\n\n`)

                  // If payment reached final state, close the connection
                  if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(updatedPayment.status)) {
                    controller.enqueue(`data: ${JSON.stringify({
                      type: 'complete',
                      data: { status: updatedPayment.status }
                    })}\n\n`)
                    clearInterval(pollInterval)
                    controller.close()
                    return
                  }
                }
              } else {
                // Payment not found, close connection
                controller.enqueue(`data: ${JSON.stringify({
                  type: 'error',
                  data: { message: 'Payment not found' }
                })}\n\n`)
                clearInterval(pollInterval)
                controller.close()
                return
              }
            } catch (error) {
              console.error('Error polling payment status:', error)
              controller.enqueue(`data: ${JSON.stringify({
                type: 'error',
                data: { message: 'Error checking payment status' }
              })}\n\n`)
            }
          }, 2000) // Poll every 2 seconds

          // Clean up interval when connection closes
          request.signal.addEventListener('abort', () => {
            clearInterval(pollInterval)
            controller.close()
          })

          // Timeout after 15 minutes
          setTimeout(() => {
            clearInterval(pollInterval)
            controller.enqueue(`data: ${JSON.stringify({
              type: 'timeout',
              data: { message: 'Status check timeout' }
            })}\n\n`)
            controller.close()
          }, 15 * 60 * 1000)

        } catch (error) {
          console.error('SSE stream error:', error)
          controller.enqueue(`data: ${JSON.stringify({
            type: 'error',
            data: { message: 'Stream error' }
          })}\n\n`)
          controller.close()
        }
      },
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    }
  )

  return response
}