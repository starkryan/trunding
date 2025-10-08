"use client"

import { useEffect, useState, use, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import toast from "react-hot-toast"
import { FaSyncAlt, FaArrowLeft } from "react-icons/fa"


interface PaymentPageProps {
  params: Promise<{
    orderId: string
  }>
}

export default function PaymentPage({ params }: PaymentPageProps) {
  const { orderId } = use(params)
  const router = useRouter()
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<string>("PENDING")
  const [isChecking, setIsChecking] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

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
        
        console.log("Payment status:", status)
        
        if (status === "COMPLETED") {
          // Payment completed - clear interval and redirect
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          window.location.href = `/transactions?payment_success=true&order_id=${orderId}`
          return
        } else if (status === "FAILED" || status === "CANCELLED") {
          // Payment failed - clear interval and redirect
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          window.location.href = `/transactions?payment_error=true&order_id=${orderId}&status=${status}`
          return
        } else if (status === "PENDING" && data.payment.paymentUrl) {
          // Set up iframe URL only once
          if (!paymentUrl) {
            const redirectUrl = `/api/payment/redirect/${orderId}`
            setPaymentUrl(redirectUrl)
          }
          
          // Start polling if not already started
          if (!intervalRef.current) {
            intervalRef.current = setInterval(() => checkPaymentStatus(false), 5000)
          }
        }
      }
    } catch (error) {
      console.error("Error checking payment status:", error)
      toast.error("Failed to check payment status. Please try again.")
    } finally {
      if (showLoading) setIsChecking(false)
    }
  }

  useEffect(() => {
    // Initial check
    checkPaymentStatus(true)

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [orderId])


  const handleManualRefresh = () => {
    checkPaymentStatus(true)
  }

  const handleBackToHome = () => {
    router.push('/home')
  }

  return (
    <>
      {/* Status and Controls Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToHome}
              className="p-2"
            >
              <FaArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Payment Processing</h1>
              <p className="text-sm text-muted-foreground">
                Order: {orderId} • Status: <span className={`font-medium ${
                  paymentStatus === 'COMPLETED' ? 'text-green-600' : 
                  paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED' ? 'text-red-600' : 
                  'text-yellow-600'
                }`}>{paymentStatus}</span>
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isChecking}
            className="flex items-center gap-2"
          >
            <FaSyncAlt className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Checking...' : 'Refresh'}
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
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Loading Payment Gateway</h2>
              <p className="text-muted-foreground">Please wait while we prepare your secure payment...</p>
            </div>
            <Button
              variant="outline"
              onClick={handleManualRefresh}
              disabled={isChecking}
              className="mt-4"
            >
              <FaSyncAlt className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
              {isChecking ? 'Checking...' : 'Check Status'}
            </Button>
          </div>
        </div>
      )}

      {/* Full-page iframe - only renders when paymentUrl is available */}
      {paymentUrl && (
        <iframe
          src={paymentUrl}
          className="absolute inset-0 w-full h-full border-0 m-0 p-0 block"
          style={{ paddingTop: '80px' }} // Account for fixed header
          title="Secure Payment Gateway"
          sandbox="allow-same-origin allow-scripts allow-forms allow-top-navigation allow-popups"
        />
      )}
    </>
  )
}
