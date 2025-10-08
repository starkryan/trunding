"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Spinner } from "@/components/ui/spinner"
import toast from "react-hot-toast"


interface PaymentPageProps {
  params: Promise<{
    orderId: string
  }>
}

export default function PaymentPage({ params }: PaymentPageProps) {
  const { orderId } = use(params)
  const router = useRouter()
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)

  useEffect(() => {
    const loadPaymentDetails = async () => {
      try {
        // Get payment details from our API
        const response = await fetch(`/api/payment/details/${orderId}`)
        if (!response.ok) {
          throw new Error("Payment not found")
        }

        const data = await response.json()
        
        if (data.success && data.payment && data.payment.paymentUrl) {
          // Use the redirect URL for the iframe - this keeps the user on our domain
          const redirectUrl = `/api/payment/redirect/${orderId}`
          setPaymentUrl(redirectUrl)
        } else {
          throw new Error("Invalid payment details")
        }
      } catch (error) {
        toast.error("Failed to load payment details. Please try again.")
      }
    }

    loadPaymentDetails()
  }, [orderId])


  return (
    <>
   
      {/* Single unified loading overlay */}
      <div 
        id="loading-overlay" 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--muted)/0.2) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          transition: 'opacity 0.3s ease-out'
        }}
      >
        <div style={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem'
        }}>
          <div style={{
            position: 'relative',
            width: '4rem',
            height: '4rem'
          }}>
            <Image
              src="/logo.png"
              alt="Montra Logo"
              fill
              style={{
                objectFit: 'contain',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }}
              priority
            />
          </div>
          <Spinner variant="bars" size={32} className="text-primary" aria-hidden="true" />
        </div>
      </div>

      {/* Full-page iframe - only renders when paymentUrl is available */}
      {paymentUrl && (
        <iframe
          src={paymentUrl}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            margin: 0,
            padding: 0,
            display: 'block'
          }}
          title="Secure Payment Gateway"
          sandbox="allow-same-origin allow-scripts allow-forms allow-top-navigation allow-popups"
          onLoad={() => {
            // Hide loading overlay when iframe loads
            setTimeout(() => {
              const overlay = document.getElementById('loading-overlay');
              if (overlay) {
                overlay.style.opacity = '0';
                setTimeout(() => {
                  overlay.style.display = 'none';
                }, 300);
              }
            }, 800);
          }}
        />
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <script dangerouslySetInnerHTML={{
        __html: `
          // Fallback: hide loading overlay after 5 seconds
          setTimeout(() => {
            const overlay = document.getElementById('loading-overlay');
            if (overlay) {
              overlay.style.opacity = '0';
              setTimeout(() => {
                overlay.style.display = 'none';
              }, 300);
            }
          }, 5000);

          // Prevent right-click to hide URL
          document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            return false;
          });

          // Prevent some keyboard shortcuts
          document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && (e.key === 'u' || e.key === 's' || e.key === 'a')) {
              e.preventDefault();
              return false;
            }
          });

          // Hide loading overlay when iframe loads
          window.addEventListener('message', function(event) {
            if (event.data === 'iframeLoaded') {
              const overlay = document.getElementById('loading-overlay');
              if (overlay) {
                overlay.style.opacity = '0';
                setTimeout(() => {
                  overlay.style.display = 'none';
                }, 300);
              }
            }
          });
        `
      }} />
    </>
  )
}
