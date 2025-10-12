import { NextRequest, NextResponse } from 'next/server'
import { CreateOrderSDK } from '@/lib/pay0-sdk'
import { CheckOrderStatusSDK } from '@/lib/pay0-sdk'
import { paymentService } from '@/lib/payment-service'

export async function GET() {
  try {
    const debug = {
      timestamp: new Date().toISOString(),
      pay0Credentials: {
        apiKey: !!process.env.PAY0_API_KEY,
        apiKeyLength: process.env.PAY0_API_KEY?.length || 0,
        apiKeyPrefix: process.env.PAY0_API_KEY?.substring(0, 8) + '...' || null,
      },
      environment: {
        WEBHOOK_URL: process.env.WEBHOOK_URL,
        NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      }
    }

    // Test 1: Direct Pay0 API call
    const createOrderSDK = new CreateOrderSDK()
    const testOrderPayload = {
      customer_mobile: '9876543210',
      customer_name: 'Debug User',
      user_token: process.env.PAY0_API_KEY || '',
      amount: '1.00',
      order_id: `TEST${Date.now()}`,
      redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/home`,
      remark1: 'Debug Test',
      remark2: 'API Test',
    }

    console.log('Testing Pay0 API with payload:', {
      ...testOrderPayload,
      user_token: testOrderPayload.user_token ? '***CONFIGURED***' : 'MISSING'
    })

    const directApiResult = await createOrderSDK.createOrder(testOrderPayload)

    // Test 2: Using PaymentService
    const paymentServiceResult = await paymentService.createPayment('PAY0', {
      userId: 'debug-user',
      amount: 1,
      currency: 'INR',
      serviceName: 'Debug Test',
      customerName: 'Debug User',
      customerMobile: '9876543210',
      returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/home`,
      webhookUrl: process.env.WEBHOOK_URL || '',
    })

    // Test 3: Check status of existing order
    let statusCheckResult = null
    if (paymentServiceResult.success && paymentServiceResult.orderId) {
      statusCheckResult = await paymentService.checkPaymentStatus('PAY0', paymentServiceResult.orderId)
    }

    return NextResponse.json({
      success: true,
      debug: {
        ...debug,
        testResults: {
          directApiCall: {
            success: directApiResult.status,
            message: directApiResult.message,
            result: directApiResult.result,
          },
          paymentServiceCall: {
            success: paymentServiceResult.success,
            error: paymentServiceResult.error,
            orderId: paymentServiceResult.orderId,
            details: paymentServiceResult.details,
          },
          statusCheck: statusCheckResult,
        }
      }
    })

  } catch (error) {
    console.error('Pay0 debug error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Debug endpoint failed',
        details: String(error),
      },
      { status: 500 }
    )
  }
}