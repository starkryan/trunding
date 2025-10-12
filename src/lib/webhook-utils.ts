import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from 'crypto'

// Webhook retry configuration
export const WEBHOOK_RETRY_CONFIG = {
  maxRetries: 5,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
}

// Webhook logging levels
export enum WebhookLogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

// Webhook event types
export enum WebhookEventType {
  PAYMENT_SUCCESS = 'payment.success',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_CANCELLED = 'payment.cancelled',
  WEBHOOK_RECEIVED = 'webhook.received',
  WEBHOOK_PROCESSED = 'webhook.processed',
  WEBHOOK_FAILED = 'webhook.failed',
  RETRY_ATTEMPT = 'webhook.retry_attempt',
}

// Webhook log interface
interface WebhookLog {
  id: string
  provider: string
  orderId: string
  eventType: WebhookLogLevel
  message: string
  metadata?: Record<string, any>
  timestamp: Date
  retryCount?: number
}

// Webhook signature validation
export class WebhookSignatureValidator {
  private static readonly PAY0_SECRET = process.env.PAY0_WEBHOOK_SECRET
  private static readonly KUKUPAY_SECRET = process.env.KUKUPAY_WEBHOOK_SECRET

  static validatePay0Signature(payload: string, signature: string): boolean {
    if (!this.PAY0_SECRET) {
      console.warn('PAY0_WEBHOOK_SECRET not configured, skipping signature validation')
      return true // Allow in development if not configured
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.PAY0_SECRET)
        .update(payload)
        .digest('hex')

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      )
    } catch (error) {
      console.error('Pay0 signature validation error:', error)
      return false
    }
  }

  static validateKukupaySignature(payload: string, signature: string): boolean {
    if (!this.KUKUPAY_SECRET) {
      console.warn('KUKUPAY_WEBHOOK_SECRET not configured, skipping signature validation')
      return true // Allow in development if not configured
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.KUKUPAY_SECRET)
        .update(payload)
        .digest('hex')

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      )
    } catch (error) {
      console.error('Kukupay signature validation error:', error)
      return false
    }
  }
}

// Webhook logging utility
export class WebhookLogger {
  static async log(logData: Omit<WebhookLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      const logEntry: WebhookLog = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        ...logData,
      }

      // Log to console for development
      console.log(`[${logData.eventType}] [${logData.provider}] [${logData.orderId}] ${logData.message}`, {
        metadata: logData.metadata,
        retryCount: logData.retryCount,
      })

      // In production, you might want to log to a database or external service
      // For now, we'll keep it simple and log to console only
      // You can extend this to log to your preferred logging service

    } catch (error) {
      console.error('Failed to log webhook event:', error)
    }
  }

  static async logWebhookReceived(provider: string, orderId: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      provider,
      orderId,
      eventType: WebhookLogLevel.INFO,
      message: 'Webhook received',
      metadata,
    })
  }

  static async logWebhookProcessed(provider: string, orderId: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      provider,
      orderId,
      eventType: WebhookLogLevel.INFO,
      message: 'Webhook processed successfully',
      metadata,
    })
  }

  static async logWebhookError(provider: string, orderId: string, error: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      provider,
      orderId,
      eventType: WebhookLogLevel.ERROR,
      message: `Webhook processing failed: ${error}`,
      metadata,
    })
  }

  static async logRetryAttempt(provider: string, orderId: string, retryCount: number, error: string): Promise<void> {
    await this.log({
      provider,
      orderId,
      eventType: WebhookLogLevel.WARN,
      message: `Webhook retry attempt ${retryCount}`,
      metadata: { error, retryCount },
      retryCount,
    })
  }
}

// Retry mechanism with exponential backoff
export class WebhookRetryManager {
  static calculateDelay(attempt: number): number {
    const delay = WEBHOOK_RETRY_CONFIG.initialDelay * Math.pow(WEBHOOK_RETRY_CONFIG.backoffMultiplier, attempt - 1)
    return Math.min(delay, WEBHOOK_RETRY_CONFIG.maxDelay)
  }

  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    provider: string,
    orderId: string,
    maxRetries: number = WEBHOOK_RETRY_CONFIG.maxRetries
  ): Promise<T> {
    let lastError: Error

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        const errorMessage = error instanceof Error ? error.message : String(error)

        await WebhookLogger.logRetryAttempt(provider, orderId, attempt, errorMessage)

        if (attempt < maxRetries) {
          const delay = this.calculateDelay(attempt)
          console.log(`Retrying webhook operation for ${provider}/${orderId} in ${delay}ms (attempt ${attempt}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError!
  }
}

// Webhook delivery status tracking
export class WebhookDeliveryTracker {
  static async markWebhookReceived(orderId: string, provider: string): Promise<void> {
    try {
      await prisma.payment.updateMany({
        where: {
          providerOrderId: orderId,
          provider: provider as any,
        },
        data: {
          webhookReceived: true,
          metadata: {
            webhookReceivedAt: new Date().toISOString(),
          },
        },
      })
    } catch (error) {
      console.error('Failed to mark webhook as received:', error)
    }
  }

  static async getWebhookStats(): Promise<{
    totalWebhooks: number
    successfulWebhooks: number
    failedWebhooks: number
    pendingWebhooks: number
  }> {
    try {
      const [totalWebhooks, successful, failed, pending] = await Promise.all([
        prisma.payment.count({
          where: {
            webhookReceived: true,
          },
        }),
        prisma.payment.count({
          where: {
            webhookReceived: true,
            status: 'COMPLETED',
          },
        }),
        prisma.payment.count({
          where: {
            webhookReceived: true,
            status: { in: ['FAILED', 'CANCELLED'] },
          },
        }),
        prisma.payment.count({
          where: {
            webhookReceived: false,
            status: 'PENDING',
          },
        }),
      ])

      return {
        totalWebhooks,
        successfulWebhooks: successful,
        failedWebhooks: failed,
        pendingWebhooks: pending,
      }
    } catch (error) {
      console.error('Failed to get webhook stats:', error)
      return {
        totalWebhooks: 0,
        successfulWebhooks: 0,
        failedWebhooks: 0,
        pendingWebhooks: 0,
      }
    }
  }
}

// Utility to extract webhook signature from headers
export function extractWebhookSignature(request: NextRequest, provider: string): string | null {
  switch (provider.toUpperCase()) {
    case 'PAY0':
      return request.headers.get('x-pay0-signature') || request.headers.get('pay0-signature')
    case 'KUKUPAY':
      return request.headers.get('x-kukupay-signature') || request.headers.get('kukupay-signature')
    default:
      return request.headers.get('x-signature') || request.headers.get('signature')
  }
}

// Utility to check if webhook is a duplicate
export async function isDuplicateWebhook(orderId: string, provider: string, payload: any): Promise<boolean> {
  try {
    const existingPayment = await prisma.payment.findFirst({
      where: {
        providerOrderId: orderId,
        provider: provider as any,
        webhookReceived: true,
      },
    })

    if (!existingPayment) {
      return false
    }

    // Check if the webhook data is the same as what we already processed
    const existingWebhookData = existingPayment.metadata as Record<string, any> || {}
    const currentWebhookData = payload

    // Simple comparison - you can make this more sophisticated based on your needs
    return JSON.stringify(existingWebhookData.webhookData) === JSON.stringify(currentWebhookData)
  } catch (error) {
    console.error('Error checking duplicate webhook:', error)
    return false
  }
}

// Utility to validate webhook payload structure
export function validateWebhookPayload(payload: any, provider: string): { valid: boolean; error?: string } {
  switch (provider.toUpperCase()) {
    case 'PAY0':
      if (!payload.order_id || !payload.status) {
        return { valid: false, error: 'Missing required Pay0 fields: order_id, status' }
      }
      break
    case 'KUKUPAY':
      if (!payload.order_id) {
        return { valid: false, error: 'Missing required Kukupay field: order_id' }
      }
      break
    default:
      return { valid: false, error: `Unknown provider: ${provider}` }
  }

  return { valid: true }
}