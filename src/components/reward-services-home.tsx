"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FaGift, FaChartLine, FaRupeeSign, FaCoins, FaBolt, FaShieldAlt, FaClock, FaStar, FaArrowRight } from "react-icons/fa"

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

  const calculateROI = (amount: number, reward: number): string => {
    return ((reward / amount) * 100).toFixed(1)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <Spinner variant="bars" size={64} className="text-primary mx-auto" />
            <FaGift className="absolute inset-0 m-auto size-6 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading reward services...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
              <FaGift className="h-8 w-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Unable to load services</h3>
              <p className="text-muted-foreground text-sm">{error}</p>
            </div>
            <Button onClick={loadServices} variant="outline" className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (services.length === 0) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
              <FaGift className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">No Services Available</h3>
              <p className="text-muted-foreground text-sm">Check back soon for exciting rewards!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      <Card className="flex-1 w-full rounded-none shadow-none border-0 bg-background sm:rounded-lg sm:shadow-lg sm:border sm:max-w-6xl mx-auto my-8 overflow-y-auto">
        
        <CardContent className="px-4 sm:px-6 space-y-6">
          {/* Header Section */}
          <div className="flex flex-col items-center space-y-4 pt-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <FaGift className="h-10 w-10 text-primary" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-semibold">Reward Services</h3>
              <div className="flex items-center gap-2 mt-2 justify-center">
                <Badge variant="secondary" className="text-xs">
                  <FaStar className="h-3 w-3 mr-1" />
                  {services.length} Premium Services
                </Badge>
              </div>
            </div>
          </div>

          {/* Services Section */}
          <div className="space-y-4">
            <div className="relative my-6" role="separator">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted-foreground/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background px-3 text-muted-foreground">Available Services</span>
              </div>
            </div>

            {/* Services List */}
            <div className="space-y-4">
              {services.map((service) => {
                const roi = calculateROI(service.exampleAmount, service.exampleReward)
                
                return (
                  <Card key={service.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-4">
                      {/* Service Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-base">{service.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Premium reward service with guaranteed returns
                          </p>
                        </div>
                        <Badge className="bg-primary/10 text-primary border-primary/20 shrink-0">
                          +{roi}% ROI
                        </Badge>
                      </div>

                      {/* Investment Details */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <div className="bg-muted/30 rounded-lg p-2 sm:p-3 border border-muted-foreground/20 text-center min-w-0">
                          <FaRupeeSign className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mx-auto mb-1 sm:mb-2 shrink-0" />
                          <div className="text-xs sm:text-base font-semibold break-words">{formatCurrency(service.exampleAmount)}</div>
                          <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Investment</div>
                        </div>

                        <div className="bg-muted/30 rounded-lg p-2 sm:p-3 border border-muted-foreground/20 text-center min-w-0">
                          <FaCoins className="h-4 w-4 sm:h-5 sm:w-5 text-primary mx-auto mb-1 sm:mb-2 shrink-0" />
                          <div className="text-xs sm:text-base font-semibold text-primary break-words">{formatCurrency(service.exampleReward)}</div>
                          <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Reward</div>
                        </div>

                        <div className="bg-muted/30 rounded-lg p-2 sm:p-3 border border-muted-foreground/20 text-center min-w-0">
                          <FaChartLine className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mx-auto mb-1 sm:mb-2 shrink-0" />
                          <div className="text-xs sm:text-base font-semibold break-words">{formatCurrency(service.exampleQuota)}</div>
                          <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Total</div>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="flex items-center justify-around py-3 bg-muted/20 rounded-lg border border-muted-foreground/10">
                        <div className="flex items-center gap-2">
                          <FaBolt className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Instant</span>
                        </div>
                        <div className="w-px h-4 bg-muted-foreground/20"></div>
                        <div className="flex items-center gap-2">
                          <FaShieldAlt className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Secure</span>
                        </div>
                        <div className="w-px h-4 bg-muted-foreground/20"></div>
                        <div className="flex items-center gap-2">
                          <FaClock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">24/7</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        className="w-full h-12 text-base"
                        onClick={() => handleBuy(service)}
                        disabled={isProcessingPayment === service.id}
                      >
                        {isProcessingPayment === service.id ? (
                          <>
                            <Spinner variant="bars" size={16} className="mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Get Rewards
                            <FaArrowRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col px-4 sm:px-6 pb-8">
          <div className="w-full">
            <div className="bg-muted/30 rounded-lg p-4 border border-muted-foreground/20 text-center">
              <FaShieldAlt className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <h3 className="text-sm font-semibold mb-1">Secured & Trusted</h3>
              <p className="text-xs text-muted-foreground">
                All reward services are carefully vetted and secured with industry-standard security measures.
              </p>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
