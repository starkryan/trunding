import { NextRequest, NextResponse } from 'next/server'

export interface Pay0WebhookData {
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'CANCELLED'
  order_id: string
  customer_mobile?: string
  amount?: string
  remark1?: string
  remark2?: string
}

export const handlePay0Webhook = (req: NextRequest): Promise<NextResponse> => {
  return new Promise(async (resolve) => {
    try {
      if (req.method !== 'POST') {
        resolve(
          NextResponse.json(
            { success: false, error: 'Only POST requests are allowed' },
            { status: 405 }
          )
        )
        return
      }

      // Pay0 sends form-encoded data
      const body = await req.text()
      console.log('Received Pay0 webhook raw:', body)

      // Parse URL-encoded data
      const params = new URLSearchParams(body)
      const webhookData: Pay0WebhookData = {} as Pay0WebhookData

      for (const [key, value] of params.entries()) {
        webhookData[key as keyof Pay0WebhookData] = value as any
      }

      console.log('Parsed Pay0 webhook:', webhookData)

      // Validate required fields
      if (!webhookData.order_id || !webhookData.status) {
        console.error('Pay0 webhook missing required fields:', webhookData)
        resolve(
          NextResponse.json(
            { success: false, error: 'Missing required fields' },
            { status: 400 }
          )
        )
        return
      }

      // Process the webhook (this will be handled by the main webhook handler)
      resolve(
        NextResponse.json({
          success: true,
          message: 'Pay0 webhook received successfully',
          data: webhookData,
        })
      )
    } catch (error) {
      console.error('Pay0 webhook processing error:', error)
      resolve(
        NextResponse.json(
          { success: false, error: 'Internal server error' },
          { status: 500 }
        )
      )
    }
  })
}