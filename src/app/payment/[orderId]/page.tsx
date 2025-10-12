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
          toast.success("Payment Successful! Your account has been credited successfully")
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
              toast.success("Payment Successful! Your account has been credited successfully")
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

    // Initial check
    checkPaymentStatus(true)

    // Set up real-time updates
    setupRealTimeUpdates()

    // Cleanup on unmount
    return () => {
      // Close real-time connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      // Remove payment page classes when leaving
      document.documentElement.classList.remove('payment-page-active')
      document.body.classList.remove('payment-page-active')
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
      {/* Status and Controls Header - Responsive */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 h-14 sm:h-auto">
          {/* Back button and title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToHome}
              className="p-1.5 sm:p-2 h-8 w-8 sm:h-auto sm:w-auto shrink-0"
            >
              <FaArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg font-semibold truncate">Payment Processing</h1>
              <div className="flex items-center gap-2">
                {isRealTimeConnected && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 hidden sm:inline">Live</span>
                  </div>
                )}
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Order: <span className="font-mono text-xs">{orderId.slice(0, 8)}...{orderId.slice(-8)}</span> • Status: <span className={`font-medium ${
                    paymentStatus === 'COMPLETED' ? 'text-green-600' :
                    paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>{paymentStatus}</span>
                </p>
                <div className="text-xs text-muted-foreground sm:hidden">
                  <div className="flex items-center gap-1">
                    {isRealTimeConnected && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
                    <span className={`font-medium ${
                      paymentStatus === 'COMPLETED' ? 'text-green-600' :
                      paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>{paymentStatus}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isChecking}
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 h-8 sm:h-auto shrink-0"
          >
            <FaSyncAlt className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isChecking ? 'Checking...' : 'Refresh'}</span>
            <span className="sm:hidden">{isChecking ? '...' : '↻'}</span>
          </Button>
        </div>
      </div>

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
                  alt="Montra Logo"
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
        <div className="pt-14 h-full no-scrollbar">
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
