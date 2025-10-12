import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface PaymentContext {
  orderId: string
  timestamp: string
  flow?: 'mobile' | 'web'
  sessionId?: string
  paymentStartTime?: number
}

export function useMobilePayment(orderId: string) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isMobileFlow, setIsMobileFlow] = useState(false)
  const [sessionRecovered, setSessionRecovered] = useState(false)
  const [paymentContext, setPaymentContext] = useState<PaymentContext | null>(null)

  // Detect mobile payment flow
  useEffect(() => {
    const flow = searchParams.get('flow')
    const timestamp = searchParams.get('timestamp')
    const sessionId = searchParams.get('session_id')

    if (flow === 'mobile') {
      setIsMobileFlow(true)

      const context: PaymentContext = {
        orderId,
        timestamp: timestamp || Date.now().toString(),
        sessionId: sessionId || '',
        flow: 'mobile',
        paymentStartTime: Date.now(),
      }

      setPaymentContext(context)

      // Store in localStorage for persistence across app switches
      localStorage.setItem('payment_context', JSON.stringify(context))

      // Add mobile payment body class for styling
      document.body.classList.add('mobile-payment-flow')
    }

    return () => {
      document.body.classList.remove('mobile-payment-flow')
    }
  }, [orderId, searchParams])

  // Handle session recovery
  const recoverSession = useCallback(async () => {
    try {
      // Check for session recovery in URL params
      const sessionRecovery = searchParams.get('session_recovery')
      if (sessionRecovery) {
        const recoveryData = JSON.parse(atob(sessionRecovery))
        console.log('Session recovery data found:', recoveryData)

        // Store recovery data in sessionStorage
        sessionStorage.setItem('session_recovery', JSON.stringify(recoveryData))
        setSessionRecovered(true)
        return true
      }

      // Check localStorage for existing payment context
      const storedContext = localStorage.getItem('payment_context')
      if (storedContext) {
        const context: PaymentContext = JSON.parse(storedContext)

        // Check if context is recent (within 30 minutes)
        const contextAge = Date.now() - (context.paymentStartTime || 0)
        if (contextAge < 30 * 60 * 1000) { // 30 minutes
          setPaymentContext(context)
          console.log('Payment context restored from localStorage')
          return true
        } else {
          // Context expired, clean it up
          localStorage.removeItem('payment_context')
        }
      }

      return false
    } catch (error) {
      console.error('Session recovery failed:', error)
      return false
    }
  }, [searchParams])

  // Initialize session recovery
  useEffect(() => {
    if (isMobileFlow) {
      recoverSession()
    }
  }, [isMobileFlow, recoverSession])

  // Handle app visibility changes (user returns from PhonePe)
  useEffect(() => {
    if (!isMobileFlow) return

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('User returned to app - checking payment status')

        // Clear any existing recovery data and check status
        recoverSession()

        // Trigger a status check by reloading the page or calling an API
        window.location.reload()
      }
    }

    const handlePageFocus = () => {
      console.log('Payment page gained focus')
      recoverSession()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handlePageFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handlePageFocus)
    }
  }, [isMobileFlow, recoverSession])

  // Handle session timeout warnings
  useEffect(() => {
    if (!isMobileFlow || !paymentContext?.paymentStartTime) return

    const checkSessionTimeout = () => {
      const elapsed = Date.now() - paymentContext.paymentStartTime!
      const timeout = 25 * 60 * 1000 // 25 minutes (show warning before 30 min timeout)

      if (elapsed > timeout) {
        console.warn('Payment session timeout approaching')
        // Could show a warning to user here
      }
    }

    const interval = setInterval(checkSessionTimeout, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [isMobileFlow, paymentContext])

  // Clean up payment context when payment is complete
  const cleanupPaymentContext = useCallback(() => {
    localStorage.removeItem('payment_context')
    sessionStorage.removeItem('session_recovery')
    setPaymentContext(null)
    setIsMobileFlow(false)
  }, [])

  return {
    isMobileFlow,
    sessionRecovered,
    paymentContext,
    recoverSession,
    cleanupPaymentContext,
  }
}

export function usePaymentStatusPolling(orderId: string, interval: number = 5000) {
  const [isPolling, setIsPolling] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const startPolling = useCallback(() => {
    if (isPolling) return

    setIsPolling(true)
    console.log('Starting payment status polling')

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payment/details/${orderId}`)
        if (response.ok) {
          const data = await response.json()
          setLastCheck(new Date())

          // Stop polling if payment is completed
          if (data.payment && ['COMPLETED', 'FAILED', 'CANCELLED'].includes(data.payment.status)) {
            clearInterval(pollInterval)
            setIsPolling(false)
            console.log('Payment status polling stopped - payment completed')
          }
        }
      } catch (error) {
        console.error('Payment status polling error:', error)
      }
    }, interval)

    // Cleanup function
    return () => {
      clearInterval(pollInterval)
      setIsPolling(false)
    }
  }, [orderId, interval, isPolling])

  return {
    isPolling,
    lastCheck,
    startPolling,
  }
}