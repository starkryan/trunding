"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FaChartLine, FaRupeeSign, FaCoins, FaBolt, FaShieldAlt, FaClock, FaArrowRight, FaFilter } from "react-icons/fa"
import { Component as Carousel } from "@/components/ui/carousel"
import Marquee from "react-fast-marquee"

interface RewardService {
  id: string
  name: string
  exampleAmount: number
  exampleReward: number
  exampleQuota: number
}

interface PriceTab {
  id: string
  name: string
  min: number
  max: number
  color: string
}

interface RecentWin {
  id: string
  userName: string
  amount: string
  gameImage: string
}

const priceTabs: PriceTab[] = [
  { id: "all", name: "All", min: 0, max: Infinity, color: "bg-primary text-primary-foreground border-primary" },
  { id: "low", name: "₹300-₹1K", min: 300, max: 1000, color: "bg-primary text-primary-foreground border-primary" },
  { id: "medium", name: "₹1K-₹10K", min: 1000, max: 10000, color: "bg-primary text-primary-foreground border-primary" },
  { id: "high", name: "₹10K+", min: 10000, max: Infinity, color: "bg-primary text-primary-foreground border-primary" },
]

export default function RewardServicesHome() {
  const [services, setServices] = useState<RewardService[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState<string>("all")
  const [carouselWidth, setCarouselWidth] = useState(1200)

  // Recent wins data
  const [wins] = useState<RecentWin[]>([
    {
      id: "1",
      userName: "Hidden",
      amount: "3,628 XMR",
      gameImage: "https://bc.imgix.net/game/image/f3c529b0a2.png?_v=4&auto=format&dpr=1&w=200",
    },
    {
      id: "2",
      userName: "Btxsyekheucc",
      amount: "120.3 ETH",
      gameImage: "https://bc.imgix.net/game/image/3758_Sweet Bonanza.png?_v=4&auto=format&dpr=1&w=200",
    },
    {
      id: "3",
      userName: "Hidden",
      amount: "498K USDT",
      gameImage: "https://bc.imgix.net/game/image/13106_The Zeus vs Hades.png?_v=4&auto=format&dpr=1&w=200",
    },
    {
      id: "4",
      userName: "Fhdrehopoxcc",
      amount: "381K USDT",
      gameImage: "https://bc.imgix.net/game/image/97e458b32f.png?_v=4&auto=format&dpr=1&w=200",
    },
    {
      id: "5",
      userName: "Hidden",
      amount: "1,101 XMR",
      gameImage: "https://bc.imgix.net/game/image/15935_Sugar rush 1000.png?_v=4&auto=format&dpr=1&w=200",
    },
    {
      id: "6",
      userName: "BETPORTALL",
      amount: "NGN 464.84M",
      gameImage: "https://bc.imgix.net/game/image/8944712a5d.png?_v=4&auto=format&dpr=1&w=200",
    },
    {
      id: "7",
      userName: "EllieEllie",
      amount: "218.4K USDT",
      gameImage: "https://bc.imgix.net/game/image/c5235e23d9.png?_v=4&auto=format&dpr=1&w=200",
    },
    {
      id: "8",
      userName: "Hidden",
      amount: "¥32M",
      gameImage: "https://bc.imgix.net/game/image/e62d2fed8c.png?_v=4&auto=format&dpr=1&w=200",
    },
    {
      id: "9",
      userName: "CryptoKing",
      amount: "2,847 ETH",
      gameImage: "https://bc.imgix.net/game/image/2f2fb0a3e8.png?_v=4&auto=format&dpr=1&w=200",
    },
    {
      id: "10",
      userName: "Hidden",
      amount: "892K USDT",
      gameImage: "https://bc.imgix.net/game/image/0afd1d52b2.png?_v=4&auto=format&dpr=1&w=200",
    },
    {
      id: "11",
      userName: "Zyvptdiggtac",
      amount: "119.88K USDT",
      gameImage: "https://bc.imgix.net/game/image/aa1281b64a.png?_v=4&auto=format&dpr=1&w=200",
    },
    {
      id: "12",
      userName: "tony1100",
      amount: "199.8K USDT",
      gameImage: "https://bc.imgix.net/game/image/3660abce4d.png?_v=4&auto=format&dpr=1&w=200",
    },
    {
      id: "13",
      userName: "Hidden",
      amount: "156.7 BTC",
      gameImage: "https://bc.imgix.net/game/image/1c27672ffd.png?_v=4&auto=format&dpr=1&w=200",
    },
    {
      id: "14",
      userName: "Ocpyghsucycc",
      amount: "198.8K USDT",
      gameImage: "https://bc.imgix.net/game/image/78b232954e.png?_v=4&auto=format&dpr=1&w=200",
    },
    {
      id: "15",
      userName: "Hidden",
      amount: "777.3 XRP",
      gameImage: "https://bc.imgix.net/game/image/84a331af34.png?_v=4&auto=format&dpr=1&w=200",
    },
    {
      id: "16",
      userName: "EliteTrader",
      amount: "3.2M USDT",
      gameImage: "https://bc.imgix.net/game/image/15547_Land of the Free.png?_v=4&auto=format&dpr=1&w=200",
    },
  ])

  // Recent wins component
  const WinCard = ({ win }: { win: RecentWin }) => (
    <div className="flex-none flex flex-col items-center w-14 hover:opacity-80 transition-opacity cursor-pointer mr-3">
      {/* Card with Image */}
      <div className="relative mb-1 w-full rounded-lg pt-[133%] overflow-hidden">
        <Image
          src={win.gameImage}
          alt="Game"
          fill
          className="object-cover rounded-lg"
          sizes="(max-width: 768px) 56px, 56px"
          onError={(e) => {
            // Fallback to a solid color with initials if image fails
            const target = e.target as HTMLImageElement;
            target.src = `https://via.placeholder.com/200x267/hsl(var(--primary))/hsl(var(--primary-foreground))?text=${win.userName.substring(0, 2).toUpperCase()}`;
          }}
        />
      </div>

      {/* User Info */}
      <div className="w-[118%] text-center">
        {/* Username */}
        <div className="flex items-center justify-center font-extrabold text-muted-foreground text-xs">
          <Image
            src="https://bc.imgix.net/assets/vip/badge-diamond.png?_v=4&auto=format&dpr=1&w=20"
            alt="VIP"
            width={14}
            height={14}
            className="mr-1"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          <span className="truncate -ml-0.5" style={{ fontSize: '10px' }}>
            {win.userName}
          </span>
        </div>

        {/* Amount */}
        <div className="whitespace-nowrap text-center font-extrabold text-primary" style={{ fontSize: '10px' }}>
          {win.amount}
        </div>
      </div>
    </div>
  )

  useEffect(() => {
    loadServices()
  }, [])

  useEffect(() => {
    const updateCarouselWidth = () => {
      // Use visual viewport width for better mobile compatibility
      const vw = window.visualViewport?.width || window.innerWidth
      // Ensure minimum width for desktop, but use full viewport for mobile
      setCarouselWidth(vw)
    }

    updateCarouselWidth()
    window.addEventListener('resize', updateCarouselWidth)
    window.addEventListener('orientationchange', updateCarouselWidth)

    return () => {
      window.removeEventListener('resize', updateCarouselWidth)
      window.removeEventListener('orientationchange', updateCarouselWidth)
    }
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
                alt="Montra Logo"
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
      {/* Carousel Section */}
      <div className="w-full pt-[64px] md:pt-0 relative z-10">
        <div className="relative w-full bg-background" style={{ height: '280px', overflow: 'hidden' }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="[&>div]:border-0 [&>div]:p-0 [&>div]:rounded-none [&>div]:bg-transparent [&>div]:pb-4 [&>div>div]:border-0 [&>div>div]:rounded-none [&>div>div]:bg-transparent w-full [&>div>div]:max-w-full [&>div>div]:mx-auto [&>div>div]:transform [&>div>div]:translate-x-0">
              <Carousel
                baseWidth={carouselWidth}  // Add 32px to account for carousel internal padding (16px each side)
                autoplay={true}
                autoplayDelay={3000}
                pauseOnHover={true}
                loop={true}
                round={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Wins Section */}
        <div className="px-4 pt-0 pb-4">
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <FaChartLine className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Recent Wins</h3>
            </div>
            <p className="text-sm text-muted-foreground">See what our winners are achieving</p>
          </div>
          <div className="bg-background/50 backdrop-blur-sm rounded-lg border border-border/20 p-4">
            <Marquee
              speed={30}
              pauseOnHover={true}
              gradient={false}
              className="gap-8"
            >
              {wins.map((win) => (
                <WinCard key={win.id} win={win} />
              ))}
            </Marquee>
          </div>
        </div>

      {/* Reward Services Section */}
      <Card className="w-full rounded-none shadow-none border-0 bg-background sm:rounded-lg sm:shadow-lg sm:border sm:max-w-6xl mx-auto my-4 sm:my-8 overflow-y-auto" style={{ minHeight: '500px' }}>

        <CardContent className="px-3 sm:px-4 md:px-6 space-y-4 sm:space-y-6">
          {/* Price Tabs */}
          <div className="pt-4 sm:pt-6">
            <div className="flex items-center gap-2 mb-4">
              <FaFilter className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-muted-foreground">Filter by Investment Amount</h3>
            </div>

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
