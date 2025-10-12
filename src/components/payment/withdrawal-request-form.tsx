"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import {
  CreditCard,
  Building2,
  Smartphone,
  ArrowRight,
  AlertCircle,
  Info
} from "lucide-react"

interface PaymentMethod {
  id: string
  type: "BANK_ACCOUNT" | "UPI"
  isDefault: boolean
  isActive: boolean
  accountName?: string
  bankName?: string
  ifscCode?: string
  upiId?: string
  upiName?: string
  phoneNumber?: string
  createdAt: string
  accountNumber?: string // Masked
}

interface WithdrawalRequestFormProps {
  onSuccess?: () => void
  walletBalance?: number
}

export default function WithdrawalRequestForm({ onSuccess, walletBalance = 0 }: WithdrawalRequestFormProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    withdrawalMethodId: "",
    amount: ""
  })

  // Get default and active payment methods
  const [activePaymentMethods, setActivePaymentMethods] = useState<PaymentMethod[]>([])
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState<PaymentMethod | null>(null)

  // Fetch payment methods
  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch("/api/user/payment-methods")
      const data = await response.json()

      if (data.success) {
        const active = data.paymentMethods.filter((method: PaymentMethod) => method.isActive)
        const defaultMethod = active.find((method: PaymentMethod) => method.isDefault)
        setActivePaymentMethods(active)
        setDefaultPaymentMethod(defaultMethod || null)
      } else {
        toast.error(data.error || "Failed to fetch payment methods")
      }
    } catch (error) {
      toast.error("Network error. Please try again.")
      console.error("Payment methods fetch error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  // Cleanup function to prevent memory leaks
  useEffect(() => {
    return () => {
      // Reset states when component unmounts
      setFormData({ withdrawalMethodId: "", amount: "" })
      setIsSubmitting(false)
    }
  }, [])

  // Set default payment method when available
  useEffect(() => {
    if (defaultPaymentMethod && !formData.withdrawalMethodId) {
      setFormData(prev => ({ ...prev, withdrawalMethodId: defaultPaymentMethod.id }))
    }
  }, [defaultPaymentMethod, formData.withdrawalMethodId])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const amount = parseFloat(formData.amount)

      if (!formData.withdrawalMethodId) {
        toast.error("Please select a payment method")
        setIsSubmitting(false)
        return
      }

      if (isNaN(amount) || amount < 300) {
        toast.error("Minimum withdrawal amount is ₹300")
        setIsSubmitting(false)
        return
      }

      if (amount > 100000) {
        toast.error("Maximum withdrawal amount is ₹100,000")
        setIsSubmitting(false)
        return
      }

      if (amount > walletBalance) {
        toast.error("Insufficient wallet balance")
        setIsSubmitting(false)
        return
      }

      const response = await fetch("/api/user/withdrawal-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          withdrawalMethodId: formData.withdrawalMethodId,
          amount: amount
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Withdrawal submitted successfully!")
        setFormData({ withdrawalMethodId: defaultPaymentMethod?.id || "", amount: "" })
        onSuccess?.()
      } else {
        toast.error(data.error || "Failed to submit withdrawal request")
      }
    } catch (error) {
      toast.error("Network error. Please try again.")
      console.error("Withdrawal request error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Spinner variant="bars" size={24} className="text-primary" />
          <span className="ml-2 text-muted-foreground">Loading payment methods...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Request Withdrawal
          </CardTitle>
          <CardDescription>
            Withdraw funds from your wallet to your registered payment method
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Wallet Balance Display */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-2xl font-bold">₹{walletBalance.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}</p>
              </div>
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>

          {/* Withdrawal Limits */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Withdrawal Limits:</strong> Minimum ₹300 • Maximum ₹100,000 per transaction
            </AlertDescription>
          </Alert>

          {/* Payment Methods */}
          {activePaymentMethods.length === 0 ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No active payment methods found. Please add a payment method first.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Select Payment Method</Label>
              <Select
                value={formData.withdrawalMethodId || ""}
                onValueChange={(value) => setFormData(prev => ({ ...prev, withdrawalMethodId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method">
                    {(formData.withdrawalMethodId || defaultPaymentMethod?.id) ? (
                      <div className="flex items-center gap-2">
                        {(formData.withdrawalMethodId ? activePaymentMethods.find(m => m.id === formData.withdrawalMethodId) : defaultPaymentMethod)?.type === "BANK_ACCOUNT" ? (
                          <Building2 className="h-4 w-4" />
                        ) : (
                          <Smartphone className="h-4 w-4" />
                        )}
                        <span>
                          {(formData.withdrawalMethodId ? activePaymentMethods.find(m => m.id === formData.withdrawalMethodId) : defaultPaymentMethod)?.type === "BANK_ACCOUNT"
                            ? `${(formData.withdrawalMethodId ? activePaymentMethods.find(m => m.id === formData.withdrawalMethodId) : defaultPaymentMethod)?.bankName} - ${(formData.withdrawalMethodId ? activePaymentMethods.find(m => m.id === formData.withdrawalMethodId) : defaultPaymentMethod)?.accountNumber}`
                            : `${(formData.withdrawalMethodId ? activePaymentMethods.find(m => m.id === formData.withdrawalMethodId) : defaultPaymentMethod)?.upiId}`
                          }
                        </span>
                      </div>
                    ) : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {activePaymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      <div className="flex items-center gap-2">
                        {method.type === "BANK_ACCOUNT" ? (
                          <Building2 className="h-4 w-4" />
                        ) : (
                          <Smartphone className="h-4 w-4" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            {method.type === "BANK_ACCOUNT" ? (
                              <span>{method.bankName} - {method.accountNumber}</span>
                            ) : (
                              <span>{method.upiId}</span>
                            )}
                            {method.isDefault && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          {method.type === "BANK_ACCOUNT" && (
                            <div className="text-xs text-muted-foreground">
                              {method.accountName} • {method.ifscCode}
                            </div>
                          )}
                          {method.type === "UPI" && (
                            <div className="text-xs text-muted-foreground">
                              {method.upiName} • {method.phoneNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Withdrawal Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="Enter amount"
              min="300"
              max={Math.min(100000, walletBalance)}
              step="0.01"
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter amount between ₹300 and ₹{Math.min(100000, walletBalance).toLocaleString('en-IN')}
            </p>
          </div>

          {/* Quick Amount Buttons */}
          <div className="space-y-2">
            <Label>Quick Amount</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[500, 1000, 5000, 10000].map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, amount: amount.toString() }))}
                  disabled={amount > walletBalance}
                  className="text-sm"
                >
                  ₹{amount.toLocaleString('en-IN')}
                </Button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            onClick={handleSubmit}
            disabled={isSubmitting || activePaymentMethods.length === 0 || !formData.amount || parseFloat(formData.amount) < 300}
          >
            {isSubmitting ? (
              <>
                <Spinner variant="bars" size={16} className="mr-2" />
                Processing...
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4 mr-2" />
                Submit Withdrawal Request
              </>
            )}
          </Button>

          {/* Important Notice */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Withdrawal requests are typically processed within 24-48 hours. You will receive a notification once your request is approved.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}