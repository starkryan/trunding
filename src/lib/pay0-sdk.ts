export interface CreateOrderRequest {
  customer_mobile: string
  customer_name: string
  user_token: string
  amount: string
  order_id: string
  redirect_url: string
  remark1?: string
  remark2?: string
}

export interface CreateOrderResponse {
  status: boolean
  message?: string
  result?: {
    orderId: string
    payment_url: string
  }
}

export interface CheckOrderStatusRequest {
  user_token: string
  order_id: string
}

export interface CheckOrderStatusResponse {
  status: boolean
  message?: string
  result?: {
    orderId: string
    txnStatus: 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'PENDING'
    amount: string
    date: string
    utr?: string
  }
}

export class CreateOrderSDK {
  private readonly baseUrl: string
  private readonly apiKey: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    this.apiKey = process.env.PAY0_API_KEY || ''
  }

  async createOrder(payload: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      // Validate payload
      if (!payload.customer_mobile || !payload.amount || !payload.user_token) {
        return {
          status: false,
          message: 'Missing required fields: customer_mobile, amount, or user_token',
        }
      }

      // Add retry logic for network issues
      const maxRetries = 3
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const formData = new FormData()
          formData.append('customer_mobile', payload.customer_mobile)
          formData.append('customer_name', payload.customer_name)
          formData.append('user_token', payload.user_token)
          formData.append('amount', payload.amount)
          formData.append('order_id', payload.order_id)
          formData.append('redirect_url', payload.redirect_url)
          formData.append('remark1', payload.remark1 || '')
          formData.append('remark2', payload.remark2 || '')

          const response = await fetch(`${this.baseUrl}/api/create-order`, {
            method: 'POST',
            headers: {
              'User-Agent': 'Mintward-Payment-SDK/1.0',
            },
            body: formData,
            signal: AbortSignal.timeout(10000), // 10 second timeout
          })

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`HTTP ${response.status}: ${errorText}`)
          }

          const result = await response.json()

          // Validate response structure
          if (!result || typeof result.status !== 'boolean') {
            throw new Error('Invalid response structure from Pay0 API')
          }

          return result
        } catch (fetchError) {
          if (attempt === maxRetries) {
            throw fetchError
          }

          // Exponential backoff
          const backoffTime = Math.min(1000, 100 * Math.pow(2, attempt - 1))
          await new Promise(resolve => setTimeout(resolve, backoffTime))
        }
      }

      throw new Error('Max retries exceeded')
    } catch (error) {
      console.error('CreateOrderSDK error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        payload: {
          ...payload,
          customer_mobile: payload.customer_mobile?.replace(/(\d{2})\d{6}(\d{2})/, '$1XXXXXX$2'), // Mask mobile number
        },
      })

      return {
        status: false,
        message: error instanceof Error ? error.message : 'Failed to create payment order',
      }
    }
  }
}

export class CheckOrderStatusSDK {
  private readonly baseUrl: string
  private readonly apiKey: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    this.apiKey = process.env.PAY0_API_KEY || ''
  }

  async checkOrderStatus(payload: CheckOrderStatusRequest): Promise<CheckOrderStatusResponse> {
    try {
      const formData = new FormData()
      formData.append('user_token', payload.user_token)
      formData.append('order_id', payload.order_id)

      const response = await fetch(`${this.baseUrl}/api/check-order-status`, {
        method: 'POST',
        headers: {
          'User-Agent': 'Mintward-Payment-SDK/1.0',
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('CheckOrderStatusSDK error:', error)
      return {
        status: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }
}