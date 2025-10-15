"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FaChartLine, FaRupeeSign, FaCoins, FaBolt, FaShieldAlt, FaClock, FaArrowRight, FaFilter } from "react-icons/fa"
import BannerCarousel from "@/components/banner-carousel"
import { IoFilter } from "react-icons/io5";


interface RewardService {
  id: string
  name: string
  exampleAmount: number
  exampleReward: number
  exampleQuota: number
  description?: string
}

interface PriceTab {
  id: string
  name: string
  min: number
  max: number
  color: string
}

const priceTabs: PriceTab[] = [
  { id: "all", name: "All", min: 0, max: Infinity, color: "bg-primary text-primary-foreground border-primary" },
  { id: "low", name: "₹300-₹1K", min: 300, max: 1000, color: "bg-primary text-primary-foreground border-primary" },
  { id: "medium", name: "₹1K-₹10K", min: 1000, max: 10000, color: "bg-primary text-primary-foreground border-primary" },
  { id: "high", name: "₹10K+", min: 10000, max: Infinity, color: "bg-primary text-primary-foreground border-primary" },
]

// Helper function to get status icon based on service name
const getStatusIcon = (serviceName: string): string => {
  const normalizedServiceName = serviceName.toLowerCase().trim()

  // Map service names to their corresponding status icons
  const serviceIconMap: { [key: string]: string } = {
    'bronze': '/status/bronze.png',
    'silver': '/status/silver.png',
    'gold': '/status/gold.png',
    'diamond': '/status/diamond.png',
    'platinum': '/status/platinum.png'
  }

  // Check if the service name contains any of the known types
  for (const [type, iconPath] of Object.entries(serviceIconMap)) {
    if (normalizedServiceName.includes(type)) {
      return iconPath
    }
  }

  // Return a default icon or empty string if no match found
  return ''
}


export default function RewardServicesHome() {
  const [services, setServices] = useState<RewardService[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState<string>("all")

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

  const getFilteredServices = (): RewardService[] => {
    if (selectedTab === "all") return services

    const tab = priceTabs.find(t => t.id === selectedTab)
    if (!tab) return services

    return services.filter(service =>
      service.exampleAmount >= tab.min && service.exampleAmount < tab.max
    )
  }

  const getTabCount = (tab: PriceTab): number => {
    if (tab.id === "all") return services.length
    return services.filter(service =>
      service.exampleAmount >= tab.min && service.exampleAmount < tab.max
    ).length
  }

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
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
            <Spinner variant="bars" size={32} className="text-primary" />
          </div>
          <p className="text-muted-foreground">Loading services...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6 text-center space-y-4">
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

  const filteredServices = getFilteredServices()

  if (services.length === 0) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">No Services Available</h3>
              <p className="text-muted-foreground text-sm">Check back soon!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full bg-gradient-to-br from-background via-background to-muted/20">
      {/* Banner Carousel Section */}
      <div className="w-full">
        <BannerCarousel />
      </div>

  
      {/* Reward Services Section */}
      <Card className="w-full rounded-none shadow-none border-0 bg-background sm:rounded-lg sm:shadow-lg sm:border sm:max-w-6xl mx-auto my-4 sm:my-8 overflow-y-auto" style={{ minHeight: '500px' }}>

        <CardContent className="px-3 sm:px-4 md:px-6">
          {/* Price Tabs */}
          <div className="space-y-4">
            {/* Filter Header */}
            <div className="flex items-center gap-2">
              <IoFilter className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-muted-foreground">Filter</h3>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2 no-scrollbar">
              {priceTabs.map((tab) => {
                const count = getTabCount(tab)
                const isActive = selectedTab === tab.id

                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`
                      inline-flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0
                      ${isActive
                        ? tab.color + " border shadow-sm"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent"
                      }
                    `}
                  >
                    {tab.name}
                    <span className={`
                      inline-flex items-center justify-center w-5 h-5 text-xs rounded-full
                      ${isActive
                        ? "bg-white/80"
                        : "bg-muted-foreground/20"
                      }
                    `}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Services Section */}
          <div className="space-y-4">

            {/* Services List */}
            <div className="space-y-4">
              {filteredServices.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="pt-6 text-center space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">No Services in This Range</h3>
                      <p className="text-muted-foreground text-sm">
                        Try selecting a different price range to see available services.
                      </p>
                    </div>
                    <Button
                      onClick={() => setSelectedTab("all")}
                      variant="outline"
                      size="sm"
                    >
                      Show All Services
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredServices.map((service) => {
                const roi = calculateROI(service.exampleAmount, service.exampleReward)
                
                return (
                  <Card key={service.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-4">
                      {/* Service Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {/* Status Icon */}
                            {getStatusIcon(service.name) && (
                              <div className="relative w-12 h-12 shrink-0">
                                <Image
                                  src={getStatusIcon(service.name)}
                                  alt={`${service.name} status`}
                                  fill
                                  className="object-contain"
                                  sizes="48px"
                                  priority
                                />
                              </div>
                            )}
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg capitalize">{service.name}</h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {service.description || "Premium reward service with guaranteed returns"}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-primary/10 text-primary border-primary/20 shrink-0">
                            +{roi}% ROI
                          </Badge>
                        </div>
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
                          <FaBolt className={`h-4 w-4 ${
                            service.name.toLowerCase().includes('bronze') ? 'text-amber-500' :
                            service.name.toLowerCase().includes('silver') ? 'text-gray-300' :
                            service.name.toLowerCase().includes('gold') ? 'text-yellow-400' :
                            service.name.toLowerCase().includes('diamond') ? 'text-blue-300' :
                            service.name.toLowerCase().includes('platinum') ? 'text-gray-400' :
                            'text-muted-foreground'
                          }`} />
                          <span className="text-xs text-muted-foreground">Instant</span>
                        </div>
                        <div className="w-px h-4 bg-muted-foreground/20"></div>
                        <div className="flex items-center gap-2">
                          <FaShieldAlt className={`h-4 w-4 ${
                            service.name.toLowerCase().includes('bronze') ? 'text-amber-500' :
                            service.name.toLowerCase().includes('silver') ? 'text-gray-300' :
                            service.name.toLowerCase().includes('gold') ? 'text-yellow-400' :
                            service.name.toLowerCase().includes('diamond') ? 'text-blue-300' :
                            service.name.toLowerCase().includes('platinum') ? 'text-gray-400' :
                            'text-muted-foreground'
                          }`} />
                          <span className="text-xs text-muted-foreground">Secure</span>
                        </div>
                        <div className="w-px h-4 bg-muted-foreground/20"></div>
                        <div className="flex items-center gap-2">
                          <FaClock className={`h-4 w-4 ${
                            service.name.toLowerCase().includes('bronze') ? 'text-amber-500' :
                            service.name.toLowerCase().includes('silver') ? 'text-gray-300' :
                            service.name.toLowerCase().includes('gold') ? 'text-yellow-400' :
                            service.name.toLowerCase().includes('diamond') ? 'text-blue-300' :
                            service.name.toLowerCase().includes('platinum') ? 'text-gray-400' :
                            'text-muted-foreground'
                          }`} />
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
                            Invest Now
                            
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )
                })
              )}
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
