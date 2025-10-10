"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/context/auth-context"
import { Spinner } from "@/components/ui/spinner"
import PaymentMethodsManager from "@/components/payment/payment-methods-manager"
import WithdrawalRequestForm from "@/components/payment/withdrawal-request-form"
import {
  ArrowRight,
  CreditCard,
  History,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Building2,
  Smartphone
} from "lucide-react"

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
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([])
  const [isLoadingRequests, setIsLoadingRequests] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && !session) {
      router.push("/signin")
    }
  }, [session, loading, router])

  // Fetch wallet balance and withdrawal requests
  useEffect(() => {
    const fetchData = async () => {
      if (!session) return

      try {
        // Fetch wallet balance
        const walletResponse = await fetch("/api/wallet")
        const walletData = await walletResponse.json()
        if (walletData.success) {
          setWalletBalance(walletData.wallet.balance)
        }

        // Fetch withdrawal requests
        const requestsResponse = await fetch("/api/user/withdrawal-requests")
        const requestsData = await requestsResponse.json()
        if (requestsData.success) {
          setWithdrawalRequests(requestsData.withdrawalRequests)
        }
      } catch (error) {
        console.error("Error fetching withdrawal data:", error)
      } finally {
        setIsLoadingRequests(false)
      }
    }

    if (session) {
      fetchData()
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case "APPROVED":
        return <Badge className="bg-blue-100 text-blue-700"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case "PROCESSING":
        return <Badge className="bg-purple-100 text-purple-700"><Clock className="h-3 w-3 mr-1" />Processing</Badge>
      case "COMPLETED":
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      case "FAILED":
        return <Badge className="bg-red-100 text-red-700"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const refreshData = () => {
    setIsLoadingRequests(true)
    fetchData()
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Withdrawal</h1>
        <p className="text-muted-foreground">
          Manage your payment methods and withdrawal requests
        </p>
      </div>

      {/* Wallet Balance Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Your Wallet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-3xl font-bold">₹{walletBalance.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Withdrawable</p>
              <p className="text-xl font-semibold text-green-600">₹{walletBalance.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="withdraw" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="withdraw" className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            Withdraw
          </TabsTrigger>
          <TabsTrigger value="payment-methods" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment Methods
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
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

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Withdrawal History
              </CardTitle>
              <CardDescription>
                Track the status of your withdrawal requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRequests ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner variant="bars" size={24} className="text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading withdrawal history...</span>
                </div>
              ) : withdrawalRequests.length === 0 ? (
                <div className="text-center py-12">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-semibold mb-2">No Withdrawal History</h4>
                  <p className="text-sm text-muted-foreground">
                    You haven't made any withdrawal requests yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {withdrawalRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="p-2 rounded-full bg-primary/10">
                            {request.withdrawalMethod.type === "BANK_ACCOUNT" ? (
                              <Building2 className="h-5 w-5 text-primary" />
                            ) : (
                              <Smartphone className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">
                                ₹{request.amount.toLocaleString('en-IN', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </h4>
                              {getStatusBadge(request.status)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {request.withdrawalMethod.type === "BANK_ACCOUNT" ? (
                                <span>{request.withdrawalMethod.bankName} - {request.withdrawalMethod.accountNumber}</span>
                              ) : (
                                <span>{request.withdrawalMethod.upiId}</span>
                              )}
                            </div>
                            {request.rejectionReason && (
                              <p className="text-sm text-red-600">
                                Rejection reason: {request.rejectionReason}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Requested on {new Date(request.createdAt).toLocaleDateString()} at {new Date(request.createdAt).toLocaleTimeString()}
                            </p>
                            {request.processedAt && (
                              <p className="text-xs text-muted-foreground">
                                Processed on {new Date(request.processedAt).toLocaleDateString()} at {new Date(request.processedAt).toLocaleTimeString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function fetchData() {
  throw new Error("Function not implemented.")
}
