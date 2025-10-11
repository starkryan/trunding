"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/auth-context"
import { Spinner } from "@/components/ui/spinner"
import PaymentMethodsManager from "@/components/payment/payment-methods-manager"
import WithdrawalRequestForm from "@/components/payment/withdrawal-request-form"
import {
  ArrowRight,
  CreditCard} from "lucide-react"

interface WithdrawalRequest {
  id: string
  amount: number
  currency: string
  status: "PENDING" | "APPROVED" | "REJECTED" | "PROCESSING" | "COMPLETED" | "FAILED"
  rejectionReason?: string
  adminNotes?: string
  createdAt: string
  updatedAt: string
  processedAt?: string
  withdrawalMethod: {
    id: string
    type: "BANK_ACCOUNT" | "UPI"
    accountName?: string
    bankName?: string
    ifscCode?: string
    upiId?: string
    upiName?: string
    phoneNumber?: string
    accountNumber?: string
  }
}

export default function WithdrawalPage() {
  const router = useRouter()
  const { session, loading } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [walletBalance, setWalletBalance] = useState<number>(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && !session) {
      router.push("/signin")
    }
  }, [session, loading, router])

  // Fetch wallet balance
  const fetchWalletBalance = async () => {
    if (!session) return

    try {
      const walletResponse = await fetch("/api/wallet")
      const walletData = await walletResponse.json()
      if (walletData.success) {
        setWalletBalance(walletData.stats.availableBalance || walletData.wallet.balance)
      }
    } catch (error) {
      console.error("Error fetching wallet balance:", error)
    }
  }

  useEffect(() => {
    if (session) {
      fetchWalletBalance()
    }
  }, [session])

  // Show loading state while checking authentication
  if (loading || !mounted) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-6">
          <Spinner variant="bars" size={32} className="text-primary" />
        </div>
      </div>
    )
  }

  // Don't render if user is not authenticated
  if (!session) {
    return null
  }

  const refreshData = () => {
    // Refresh wallet balance
    fetchWalletBalance()
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
 


      {/* Main Tabs */}
      <Tabs defaultValue="withdraw" className="space-y-6">
        <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-full">
          <TabsTrigger
            value="withdraw"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow gap-2"
          >
            <ArrowRight className="h-4 w-4 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="truncate">Withdraw</span>
          </TabsTrigger>
          <TabsTrigger
            value="payment-methods"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow gap-2"
          >
            <CreditCard className="h-4 w-4 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="truncate">Payment Methods</span>
          </TabsTrigger>
        </TabsList>

        {/* Withdraw Tab */}
        <TabsContent value="withdraw">
          <WithdrawalRequestForm
            onSuccess={refreshData}
            walletBalance={walletBalance}
          />
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="payment-methods">
          <PaymentMethodsManager onSuccess={refreshData} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
