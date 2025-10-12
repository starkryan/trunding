import { auth } from "@/lib/auth"
import { NextRequest } from "next/server"
import { cookies } from "next/headers"

export interface PaymentSessionContext {
  orderId: string
  userId?: string
  timestamp: string
  flow?: 'mobile' | 'web'
  sessionId?: string
  paymentStartTime?: number
}

export class PaymentSessionRecovery {
  private static readonly PAYMENT_SESSION_DURATION = 30 * 60 * 1000 // 30 minutes
  private static readonly RECOVERY_COOKIE_NAME = 'payment_recovery'

  /**
   * Extend user session for payment flows
   */
  static async extendPaymentSession(request: NextRequest): Promise<boolean> {
    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      })

      if (!session?.user) {
        return false
      }

      // Set extended session cookie for payment flow
      const cookieStore = await cookies()
      cookieStore.set('payment_session_extended', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: this.PAYMENT_SESSION_DURATION / 1000, // 30 minutes
        path: '/',
      })

      cookieStore.set('payment_user_id', session.user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: this.PAYMENT_SESSION_DURATION / 1000,
        path: '/',
      })

      return true
    } catch (error) {
      console.error('Failed to extend payment session:', error)
      return false
    }
  }

  /**
   * Create recovery token for payment session
   */
  static createRecoveryToken(context: PaymentSessionContext): string {
    const tokenData = {
      ...context,
      expiresAt: Date.now() + this.PAYMENT_SESSION_DURATION,
    }

    return Buffer.from(JSON.stringify(tokenData)).toString('base64')
  }

  /**
   * Validate and parse recovery token
   */
  static validateRecoveryToken(token: string): PaymentSessionContext | null {
    try {
      const tokenData = JSON.parse(Buffer.from(token, 'base64').toString())

      if (tokenData.expiresAt && tokenData.expiresAt < Date.now()) {
        return null // Token expired
      }

      return {
        orderId: tokenData.orderId,
        userId: tokenData.userId,
        timestamp: tokenData.timestamp,
        flow: tokenData.flow,
        sessionId: tokenData.sessionId,
        paymentStartTime: tokenData.paymentStartTime,
      }
    } catch (error) {
      console.error('Failed to validate recovery token:', error)
      return null
    }
  }

  /**
   * Store payment context in secure cookie
   */
  static async storePaymentContext(context: PaymentSessionContext): Promise<void> {
    const cookieStore = await cookies()
    const recoveryToken = this.createRecoveryToken(context)

    cookieStore.set(this.RECOVERY_COOKIE_NAME, recoveryToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: this.PAYMENT_SESSION_DURATION / 1000,
      path: '/',
    })
  }

  /**
   * Retrieve payment context from cookie
   */
  static async getPaymentContext(request: NextRequest): Promise<PaymentSessionContext | null> {
    const recoveryToken = request.cookies.get(this.RECOVERY_COOKIE_NAME)?.value

    if (!recoveryToken) {
      return null
    }

    return this.validateRecoveryToken(recoveryToken)
  }

  /**
   * Check if user is in active payment flow
   */
  static async isInPaymentFlow(request: NextRequest): Promise<boolean> {
    const cookieStore = await cookies()
    const isExtended = cookieStore.get('payment_session_extended')?.value
    const userId = cookieStore.get('payment_user_id')?.value

    return !!(isExtended && userId)
  }

  /**
   * Clear payment session data
   */
  static async clearPaymentSession(): Promise<void> {
    const cookieStore = await cookies()

    cookieStore.delete('payment_session_extended')
    cookieStore.delete('payment_user_id')
    cookieStore.delete(this.RECOVERY_COOKIE_NAME)
    cookieStore.delete('payment_context')
  }

  /**
   * Auto-recover session from payment context
   */
  static async autoRecoverSession(request: NextRequest): Promise<boolean> {
    try {
      const context = await this.getPaymentContext(request)

      if (!context || !context.userId) {
        return false
      }

      // Check if we can restore the user session
      const session = await auth.api.getSession({
        headers: request.headers,
      })

      if (session?.user && session.user.id === context.userId) {
        // Session is still valid, just extend it
        return await this.extendPaymentSession(request)
      }

      // Session is invalid, but we have payment context
      // We can't automatically restore sessions for security reasons
      // But we can preserve the payment context for manual recovery
      console.log('Payment session recovery needed for user:', context.userId)

      return false
    } catch (error) {
      console.error('Failed to auto-recover session:', error)
      return false
    }
  }

  /**
   * Handle mobile app return scenarios
   */
  static async handleMobileAppReturn(request: NextRequest): Promise<{
    shouldRedirect: boolean
    redirectUrl?: string
    recoveredSession: boolean
  }> {
    const url = new URL(request.url)
    const orderId = url.pathname.split('/').pop()
    const flow = url.searchParams.get('flow')
    const sessionRecovery = url.searchParams.get('session_recovery')

    // Check if this is a mobile payment return
    if (flow === 'mobile' && orderId) {
      // Try to recover session
      const recovered = await this.autoRecoverSession(request)

      // If we have session recovery data, parse it
      if (sessionRecovery) {
        const recoveryData = this.validateRecoveryToken(sessionRecovery)
        if (recoveryData) {
          console.log('Mobile payment return with session recovery:', recoveryData)
        }
      }

      return {
        shouldRedirect: false, // Stay on payment page to check status
        recoveredSession: recovered,
      }
    }

    return {
      shouldRedirect: false,
      recoveredSession: false,
    }
  }
}