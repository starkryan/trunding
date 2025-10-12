import { CreateOrderSDK } from '@/lib/pay0-sdk'
import { CheckOrderStatusSDK } from '@/lib/pay0-sdk'
import { prisma } from '@/lib/prisma'

export interface PaymentProvider {
  name: string
  isActive: boolean
  createPayment: (data: PaymentRequest) => Promise<PaymentResponse>
  checkStatus: (orderId: string) => Promise<PaymentStatus>
}

export interface PaymentRequest {
  userId: string
  amount: number
  currency: string
  serviceId?: string
  serviceName?: string
  customerName?: string
  customerMobile?: string
  returnUrl: string
  webhookUrl: string
  orderId?: string
}

export interface PaymentResponse {
  success: boolean
  paymentUrl?: string
  orderId?: string
  transactionId?: string
  error?: string
  details?: any
}

export interface PaymentStatus {
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED'
  transactionId?: string
  amount?: number
  date?: string
  utr?: string
}

export class KukuPayProvider implements PaymentProvider {
  name = 'KUKUPAY'
  isActive = true

  private readonly apiUrl = 'https://kukupay.pro/pay/create'
  private readonly apiKey = process.env.KUKUPAY_API_KEY

  async createPayment(data: PaymentRequest): Promise<PaymentResponse> {
    try {
      const kukupayData = {
        api_key: this.apiKey,
        amount: data.amount,
        phone: data.customerMobile || '9876543210',
        webhook_url: data.webhookUrl,
        return_url: data.returnUrl,
        order_id: data.orderId,
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(kukupayData),
      })

      const kukupayResponse = await response.json()

      if (kukupayResponse.status === 200 && kukupayResponse.data?.payment_url) {
        return {
          success: true,
          paymentUrl: kukupayResponse.data.payment_url,
          orderId: data.orderId, // Return the order ID we generated
          transactionId: kukupayResponse.data.transaction_id,
        }
      }

      return {
        success: false,
        error: kukupayResponse.message || 'Failed to create payment with KUKUPAY',
        details: kukupayResponse,
      }
    } catch (error) {
      return {
        success: false,
        error: 'KUKUPAY service error',
        details: error,
      }
    }
  }

  async checkStatus(orderId: string): Promise<PaymentStatus> {
    // KUKUPAY doesn't have a status check API in the current implementation
    // We rely on webhooks for status updates
    return {
      status: 'PENDING',
    }
  }
}

export class Pay0Provider implements PaymentProvider {
  name = 'PAY0'
  isActive = true

  private readonly createOrderSDK: CreateOrderSDK
  private readonly checkOrderSDK: CheckOrderStatusSDK
  private readonly apiKey: string = process.env.PAY0_API_KEY || ''

  constructor() {
    if (!this.apiKey) {
      console.warn('PAY0_API_KEY environment variable is not set. Pay0 provider will not work.')
    }
    this.createOrderSDK = new CreateOrderSDK('https://pay0.shop')
    this.checkOrderSDK = new CheckOrderStatusSDK('https://pay0.shop')
  }

  async createPayment(data: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Validate API key
      if (!this.apiKey) {
        return {
          success: false,
          error: 'Pay0 API key is not configured',
          details: { code: 'MISSING_API_KEY' }
        }
      }

      // Validate required fields
      if (!data.amount || (typeof data.amount === 'number' ? data.amount <= 0 : parseFloat(data.amount) <= 0)) {
        return {
          success: false,
          error: 'Invalid amount provided',
          details: { amount: data.amount }
        }
      }

      const payload = {
        customer_mobile: data.customerMobile || '9876543210',
        customer_name: data.customerName || 'User',
        user_token: this.apiKey,
        amount: data.amount.toString(),
        order_id: data.orderId || '',
        redirect_url: data.returnUrl,
        remark1: data.serviceName || 'Deposit',
        remark2: `Service: ${data.serviceId || 'N/A'}`,
      }

      console.log('Pay0: Creating payment order', {
        orderId: data.orderId,
        amount: data.amount,
        serviceName: data.serviceName,
      })

      const response = await this.createOrderSDK.createOrder(payload)

      if (response.status && response.result?.payment_url) {
        console.log('Pay0: Payment order created successfully', {
          orderId: response.result.orderId,
          paymentUrl: response.result.payment_url ? 'URL_RECEIVED' : 'NO_URL'
        })

        return {
          success: true,
          paymentUrl: response.result.payment_url,
          orderId: response.result.orderId,
          transactionId: response.result.orderId, // Use orderId as transactionId for Pay0
        }
      }

      console.error('Pay0: Payment order creation failed', {
        orderId: data.orderId,
        response: response
      })

      return {
        success: false,
        error: response.message || 'Failed to create payment with Pay0',
        details: response,
      }
    } catch (error) {
      console.error('Pay0: Unexpected error during payment creation', {
        orderId: data.orderId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })

      return {
        success: false,
        error: 'Pay0 service error',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  async checkStatus(orderId: string): Promise<PaymentStatus> {
    try {
      const response = await this.checkOrderSDK.checkOrderStatus({
        user_token: this.apiKey,
        order_id: orderId,
      })

      if (response.status && response.result) {
        const result = response.result

        // Map Pay0 status to our status
        let status: PaymentStatus['status'] = 'PENDING'
        if (result.txnStatus === 'SUCCESS') {
          status = 'COMPLETED'
        } else if (result.txnStatus === 'FAILED') {
          status = 'FAILED'
        } else if (result.txnStatus === 'CANCELLED') {
          status = 'CANCELLED'
        }

        return {
          status,
          transactionId: result.utr,
          amount: parseFloat(result.amount),
          date: result.date,
          utr: result.utr,
        }
      }

      return {
        status: 'PENDING',
      }
    } catch (error) {
      console.error('Pay0 status check error:', error)
      return {
        status: 'PENDING',
      }
    }
  }
}

export class PaymentService {
  private providers: Map<string, PaymentProvider> = new Map()

  constructor() {
    this.providers.set('KUKUPAY', new KukuPayProvider())
    this.providers.set('PAY0', new Pay0Provider())
  }

  async getActiveProviders(): Promise<PaymentProvider[]> {
    // Check admin settings for which providers are active
    const settings = await this.getPaymentSettings()
    const activeProviders: PaymentProvider[] = []

    for (const [name, provider] of this.providers) {
      if (settings[name.toLowerCase()]?.enabled) {
        provider.isActive = true
        activeProviders.push(provider)
      }
    }

    // If no providers are configured, default to KUKUPAY
    if (activeProviders.length === 0) {
      this.providers.get('KUKUPAY')!.isActive = true
      activeProviders.push(this.providers.get('KUKUPAY')!)
    }

    return activeProviders
  }

  async createPayment(
    providerName: string,
    data: PaymentRequest
  ): Promise<PaymentResponse> {
    const provider = this.providers.get(providerName.toUpperCase())

    if (!provider) {
      return {
        success: false,
        error: `Payment provider ${providerName} not found`,
      }
    }

    // Generate unique order ID
    const orderId = await this.generateUniqueOrderId()
    data.orderId = orderId

    return provider.createPayment(data)
  }

  async checkPaymentStatus(
    providerName: string,
    orderId: string
  ): Promise<PaymentStatus> {
    const provider = this.providers.get(providerName.toUpperCase())

    if (!provider) {
      throw new Error(`Payment provider ${providerName} not found`)
    }

    return provider.checkStatus(orderId)
  }

  private async generateUniqueOrderId(): Promise<string> {
    const generateOrderId = () => {
      const timestamp = Date.now().toString()
      const randomPart1 = Math.random().toString(36).substr(2, 6).toUpperCase()
      const randomPart2 = Math.random().toString(36).substr(2, 6).toUpperCase()
      const microTime = process.hrtime.bigint().toString().slice(-6) // Add microsecond precision
      return `TXN${timestamp}${microTime}${randomPart1}${randomPart2}`
    }

    const ensureUniqueOrderId = async (maxRetries = 10) => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const orderId = generateOrderId()

        // Check both providerOrderId and any existing order_id in metadata
        const existingPayment = await prisma.payment.findFirst({
          where: {
            OR: [
              { providerOrderId: orderId },
              { metadata: { path: ['orderId'], equals: orderId } }
            ]
          }
        })

        if (!existingPayment) {
          return orderId
        }

        // Exponential backoff with jitter for concurrent requests
        if (attempt < maxRetries) {
          const backoffTime = Math.min(1000, 50 * Math.pow(2, attempt - 1)) + Math.random() * 100
          await new Promise(resolve => setTimeout(resolve, backoffTime))
        }
      }

      // Fallback with crypto random if all retries fail
      const timestamp = Date.now().toString()
      const cryptoRandom = require('crypto').randomBytes(8).toString('hex').toUpperCase()
      const extraRandom = Math.random().toString(36).substr(2, 8).toUpperCase()
      return `TXN${timestamp}${cryptoRandom}${extraRandom}`
    }

    return ensureUniqueOrderId()
  }

  private async getPaymentSettings(): Promise<Record<string, { enabled: boolean }>> {
    // Get payment provider settings from database or environment
    // For now, check if API keys are configured
    const settings: Record<string, { enabled: boolean }> = {
      kukupay: {
        enabled: !!process.env.KUKUPAY_API_KEY,
      },
      pay0: {
        enabled: !!process.env.PAY0_API_KEY,
      },
    }

    // Check if there are admin settings in the database
    try {
      const adminSettings = await prisma.adminSettings.findFirst({
        where: { key: 'payment_providers' },
      })

      if (adminSettings?.value) {
        // Handle both JSON string and object cases
        let dbSettings
        if (typeof adminSettings.value === 'string') {
          dbSettings = JSON.parse(adminSettings.value)
        } else {
          dbSettings = adminSettings.value
        }
        Object.assign(settings, dbSettings)
      }
    } catch (error) {
      console.error('Failed to load payment settings from database:', error)
    }

    return settings
  }

  async setPaymentProviderEnabled(
    providerName: string,
    enabled: boolean
  ): Promise<void> {
    const key = providerName.toLowerCase()

    try {
      await prisma.adminSettings.upsert({
        where: { key: 'payment_providers' },
        update: {
          value: JSON.stringify({
            ...(await this.getPaymentSettings()),
            [key]: { enabled },
          }),
        },
        create: {
          key: 'payment_providers',
          value: JSON.stringify({
            [key]: { enabled },
          }),
        },
      })
    } catch (error) {
      console.error('Failed to update payment settings:', error)
      throw error
    }
  }
}

// Singleton instance
export const paymentService = new PaymentService()