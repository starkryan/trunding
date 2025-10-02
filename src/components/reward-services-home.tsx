"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Gift, TrendingUp, IndianRupee, Coins } from "lucide-react"

interface RewardService {
  id: string
  name: string
  exampleAmount: number
  exampleReward: number
  exampleQuota: number
}

export default function RewardServicesHome() {
  const [services, setServices] = useState<RewardService[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null)

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch("/api/reward-services")
      if (response.ok) {
        const data = await response.json()
        // The API already returns only active services
        setServices(data)
      } else {
        setError("Failed to load reward services")
      }
    } catch (error) {
      console.error("Failed to load services:", error)
      setError("Network error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBuy = async (service: RewardService) => {
    try {
      setIsProcessingPayment(service.id)
      
      // Create payment request
      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId: service.id,
          amount: service.exampleAmount,
          serviceName: service.name,
        }),
      })

      const result = await response.json()
      
      if (result.success && result.paymentUrl) {
        // Redirect to payment URL
        window.location.href = result.paymentUrl
      } else {
        setError(result.error || "Failed to initiate payment")
      }
    } catch (error) {
      console.error("Payment initiation failed:", error)
      setError("Network error occurred while initiating payment")
    } finally {
      setIsProcessingPayment(null)
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Gift className="h-6 w-6" />
              Reward Services
            </h2>
          </div>
        </div>
        <div className="flex justify-center py-12">
          <Spinner variant="bars" size={24} className="text-primary" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Gift className="h-6 w-6" />
              Reward Services
            </h2>
          </div>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          <p>Unable to load reward services</p>
        </div>
      </div>
    )
  }

  if (services.length === 0) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Gift className="h-6 w-6" />
              Reward Services
            </h2>
          </div>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          <Gift className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p>No active reward services available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Content area */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Gift className="h-6 w-6" />
              Reward Services
            </h2>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div key={service.id} className="relative overflow-hidden rounded-xl border bg-card/50 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10"></div>
              <div className="relative z-10 p-6 space-y-4">
                <div className="border-t border-border/50 pt-3">
                  <div
                    className="flex items-center whitespace-nowrap text-xs gap-2"
                    role="group"
                    aria-label="Amount, reward and quota"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                
                      <span className="font-medium text-foreground">{formatCurrency(service.exampleAmount)}</span>
                    </span>

                    <span aria-hidden="true" className="text-muted-foreground">
                      •
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <Coins className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    
                      <span className="font-medium text-primary">{formatCurrency(service.exampleReward)}</span>
                    </span>

                    <span aria-hidden="true" className="text-muted-foreground">
                      •
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                     
                      <span className="font-medium text-foreground">{formatCurrency(service.exampleQuota)}</span>
                    </span>
                  </div>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => handleBuy(service)}
                  disabled={isProcessingPayment === service.id}
                >
                  {isProcessingPayment === service.id ? (
                    <Spinner variant="default" size={16} className="mr-2" />
                  ) : null}
                  {isProcessingPayment === service.id ? "Processing..." : "Buy"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
