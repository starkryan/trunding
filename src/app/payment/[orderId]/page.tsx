"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { FaSyncAlt, FaArrowLeft } from "react-icons/fa"

export default function PaymentPage() {
  const params = useParams()
  const orderId = params.orderId as string
  const router = useRouter()
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<string>("PENDING")
  const [isChecking, setIsChecking] = useState(false)
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  const checkPaymentStatus = async (showLoading = false) => {
    if (showLoading) setIsChecking(true)

    try {
      const response = await fetch(`/api/payment/details/${orderId}`)
      if (!response.ok) {
        throw new Error("Payment not found")
      }

      const data = await response.json()

      if (data.success && data.payment) {
        const status = data.payment.status
        setPaymentStatus(status)

  
        if (status === "COMPLETED") {
          // Payment completed - redirect immediately
          toast.success("🎉 Payment completed! Redirecting...")
          setTimeout(() => {
            window.location.href = `/home?payment_success=true&order_id=${orderId}`
          }, 1000)
          return
        } else if (status === "FAILED" || status === "CANCELLED") {
          // Payment failed - redirect to transactions
          toast.error(`Payment ${status.toLowerCase()}`)
          setTimeout(() => {
            window.location.href = `/transactions?payment_error=true&order_id=${orderId}&status=${status}`
          }, 1000)
          return
        } else if (status === "PENDING" && data.payment.paymentUrl) {
          // Set up iframe URL only once
          if (!paymentUrl) {
            const redirectUrl = `/api/payment/redirect/${orderId}`
            setPaymentUrl(redirectUrl)
          }
        }
      }
    } catch (error) {
        toast.error("Failed to check payment status. Please try again.")
    } finally {
      if (showLoading) setIsChecking(false)
    }
  }

  const setupRealTimeUpdates = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const eventSource = new EventSource(`/api/payment/${orderId}/status`)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setIsRealTimeConnected(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        switch (data.type) {
          case 'status':
            setPaymentStatus(data.data.status)

            if (data.data.status === "COMPLETED") {
              toast.success("🎉 Payment completed! Redirecting...")
              setTimeout(() => {
                window.location.href = `/home?payment_success=true&order_id=${orderId}`
              }, 1000)
            } else if (data.data.status === "FAILED" || data.data.status === "CANCELLED") {
              toast.error(`Payment ${data.data.status.toLowerCase()}`)
              setTimeout(() => {
                window.location.href = `/transactions?payment_error=true&order_id=${orderId}&status=${data.data.status}`
              }, 1000)
            }
            break

          case 'complete':
            break

          case 'error':
            setIsRealTimeConnected(false)
            break

          case 'timeout':
            setIsRealTimeConnected(false)
            toast.error("Status check timeout. Please refresh manually.")
            break
        }
      } catch (error) {
        // Error parsing real-time update
      }
    }

    eventSource.onerror = (error) => {
      setIsRealTimeConnected(false)
    }
  }

  useEffect(() => {
    if (!orderId) return // Don't run if orderId is not available

    // Apply payment page scrollbar hiding following best practices
    document.documentElement.classList.add('payment-page-active')
    document.body.classList.add('payment-page-active')

    // Detect mobile payment flow
    const urlParams = new URLSearchParams(window.location.search)
    const isMobileFlow = urlParams.get('flow') === 'mobile'
    const timestamp = urlParams.get('timestamp')
    const sessionId = urlParams.get('session_id')

    // Store payment context in localStorage for session recovery
    if (isMobileFlow) {
      const paymentContext = {
        orderId,
        timestamp: timestamp || Date.now().toString(),
        sessionId: sessionId || '',
        flow: 'mobile',
        // Store when user left for payment
        paymentStartTime: Date.now()
      }
      localStorage.setItem('payment_context', JSON.stringify(paymentContext))

      // Add mobile flow specific styling
      document.body.classList.add('mobile-payment-flow')
    }

    // Check for session recovery parameters
    const sessionRecovery = urlParams.get('session_recovery')
    if (sessionRecovery) {
      try {
        const recoveryData = JSON.parse(atob(sessionRecovery))
        console.log('Session recovery detected:', recoveryData)
        // Store recovery data for potential session restoration
        sessionStorage.setItem('session_recovery', JSON.stringify(recoveryData))
      } catch (error) {
        console.warn('Failed to parse session recovery data:', error)
      }
    }

    // Initial check
    checkPaymentStatus(true)

    // Set up real-time updates
    setupRealTimeUpdates()

    // Set up mobile payment flow monitoring
    let visibilityChangeHandler: (() => void) | null = null
    let pageFocusHandler: (() => void) | null = null

    if (isMobileFlow) {
      // Handle page visibility changes (user returns from PhonePe)
      visibilityChangeHandler = () => {
        if (!document.hidden) {
          console.log('User returned to payment page - checking status')
          // User returned from payment app, check status immediately
          checkPaymentStatus(true)

          // Re-establish real-time connection
          setupRealTimeUpdates()
        }
      }

      // Handle page focus events
      pageFocusHandler = () => {
        console.log('Payment page regained focus')
        checkPaymentStatus(true)
      }

      document.addEventListener('visibilitychange', visibilityChangeHandler)
      window.addEventListener('focus', pageFocusHandler)
    }

    // Set up periodic status checks for mobile flows
    let statusCheckInterval: NodeJS.Timeout | null = null
    if (isMobileFlow) {
      statusCheckInterval = setInterval(() => {
        if (!document.hidden && paymentStatus === 'PENDING') {
          checkPaymentStatus(false) // Silent check
        }
      }, 5000) // Check every 5 seconds when page is visible
    }

    // Cleanup on unmount
    return () => {
      // Close real-time connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      // Remove event listeners
      if (visibilityChangeHandler) {
        document.removeEventListener('visibilitychange', visibilityChangeHandler)
      }
      if (pageFocusHandler) {
        window.removeEventListener('focus', pageFocusHandler)
      }

      // Clear interval
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval)
      }

      // Remove payment page classes when leaving
      document.documentElement.classList.remove('payment-page-active')
      document.body.classList.remove('payment-page-active')
      document.body.classList.remove('mobile-payment-flow')

      // Clear payment context from localStorage when payment is complete
      if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(paymentStatus)) {
        localStorage.removeItem('payment_context')
      }
    }
  }, [orderId]) // Add orderId dependency


  const handleManualRefresh = () => {
    checkPaymentStatus(true)
  }

  const handleBackToHome = () => {
    router.push('/home')
  }

  return (
    <div className="h-screen hide-scrollbars">
  
      {/* Loading Overlay - shows only when no iframe loaded yet */}
      {!paymentUrl && (
        <div
          id="loading-overlay"
          className="fixed inset-0 bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center z-40"
        >
          <div className="text-center space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative w-16 h-16">
                <Image
                  src="/logo.png"
                  alt="Mintward Logo"
                  fill
                  className="object-contain animate-pulse"
                  priority
                />
              </div>
              <Spinner variant="bars" size={32} className="text-primary" aria-hidden="true" />
            </div>
            <div className="space-y-3 max-w-md mx-auto">
              <h2 className="text-xl font-semibold">Loading Payment Gateway</h2>
              <p className="text-muted-foreground">Please wait while we prepare your secure payment...</p>
              <div className={`rounded-lg p-3 text-sm ${
                isRealTimeConnected
                  ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800'
                  : 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800'
              }`}>
                <p className={isRealTimeConnected ? 'text-green-800 dark:text-green-200' : 'text-blue-800 dark:text-blue-200'}>
                  {isRealTimeConnected ? (
                    <>
                      ✅ <strong>Live Updates Active</strong><br />
                      Your payment status will update instantly when completed.
                    </>
                  ) : (
                    <>
                      ⚡ <strong>Connecting to Live Updates...</strong><br />
                      Setting up real-time payment monitoring.
                    </>
                  )}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleManualRefresh}
              disabled={isChecking}
              className="mt-2"
            >
              <FaSyncAlt className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
              {isChecking ? 'Checking...' : 'Check Status Manually'}
            </Button>
          </div>
        </div>
      )}

      {/* Full-page iframe - only renders when paymentUrl is available */}
      {paymentUrl && (
        <div className="h-full no-scrollbar">
          <iframe
            src={paymentUrl}
            className="w-full h-full border-0 m-0 p-0 block no-scrollbar"
            title="Secure Payment Gateway"
            sandbox="allow-same-origin allow-scripts allow-forms allow-top-navigation allow-popups"
          />
        </div>
      )}
    </div>
  )
}
