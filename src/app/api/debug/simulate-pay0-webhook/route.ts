import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || ""

    let orderId: string
    let status: string = 'SUCCESS'

    if (contentType.includes("application/x-www-form-urlencoded")) {
      // Parse form data like the real webhook
      const body = await request.text()
      const params = new URLSearchParams(body)
      orderId = params.get('order_id') || ''
      status = params.get('status') || 'SUCCESS'
    } else {
      // Parse JSON data
      const { orderId: orderIdJson, status: statusJson = 'SUCCESS' } = await request.json()
      orderId = orderIdJson
      status = statusJson
    }

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'orderId is required' },
        { status: 400 }
      )
    }

    console.log(`Simulating Pay0 webhook for order: ${orderId} with status: ${status}`)

    // Find the payment record
    const payment = await prisma.payment.findFirst({
      where: {
        providerOrderId: orderId,
        provider: 'PAY0',
      },
      include: {
        user: true,
        wallet: true,
        rewardService: true,
      },
    })

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      )
    }

    console.log(`Found payment: ${payment.id}, current status: ${payment.status}`)

    // Check if payment is already completed
    if (payment.status === 'COMPLETED') {
      return NextResponse.json({
        success: true,
        message: 'Payment already completed',
        payment: {
          id: payment.id,
          status: payment.status,
          amount: payment.amount,
        }
      })
    }

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: status === 'SUCCESS' ? 'COMPLETED' : 'FAILED',
        webhookReceived: true,
        metadata: {
          ...(payment.metadata as Record<string, any> || {}),
          simulatedWebhook: true,
          simulatedAt: new Date().toISOString(),
        },
        completedAt: status === 'SUCCESS' ? new Date() : null,
      },
    })

    console.log(`Updated payment status to: ${updatedPayment.status}`)

    // If payment is completed, update wallet and create transaction
    if (status === 'SUCCESS' && updatedPayment.status === 'COMPLETED') {
      let wallet = payment.wallet

      // Create wallet if it doesn't exist
      if (!wallet) {
        wallet = await prisma.wallet.create({
          data: {
            userId: payment.userId,
            balance: 0,
            currency: payment.currency,
          },
        })
        console.log(`Created new wallet: ${wallet.id}`)
      }

      // Update wallet balance
      const updatedWallet = await prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            increment: payment.amount,
          },
        },
      })

      console.log(`Updated wallet balance from ${wallet.balance} to ${updatedWallet.balance}`)

      // Create transaction record
      const transaction = await prisma.transaction.create({
        data: {
          userId: payment.userId,
          walletId: wallet.id,
          amount: payment.amount,
          currency: payment.currency,
          type: 'DEPOSIT',
          status: 'COMPLETED',
          description: `Payment completed for order ${orderId}`,
          referenceId: payment.id,
          metadata: {
            paymentId: payment.id,
            providerOrderId: orderId,
            provider: 'PAY0',
            simulatedWebhook: true,
          },
        },
      })

      console.log(`Created transaction: ${transaction.id}`)

      return NextResponse.json({
        success: true,
        message: 'Payment completed and wallet updated successfully',
        payment: {
          id: updatedPayment.id,
          status: updatedPayment.status,
          amount: updatedPayment.amount,
        },
        wallet: {
          id: updatedWallet.id,
          balance: updatedWallet.balance,
        },
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Payment status updated',
      payment: {
        id: updatedPayment.id,
        status: updatedPayment.status,
        amount: updatedPayment.amount,
      }
    })

  } catch (error) {
    console.error('Simulate Pay0 webhook error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

// Get list of pending Pay0 payments
export async function GET() {
  try {
    const pendingPayments = await prisma.payment.findMany({
      where: {
        provider: 'PAY0',
        status: 'PENDING',
      },
      select: {
        id: true,
        providerOrderId: true,
        amount: true,
        currency: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        },
        wallet: {
          select: {
            id: true,
            balance: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    return NextResponse.json({
      success: true,
      pendingPayments,
      count: pendingPayments.length
    })

  } catch (error) {
    console.error('Get pending payments error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}