"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import {
  Building2,
  CreditCard,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Banknote,
  Shield
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
  updatedAt: string
  accountNumber?: string // Masked for display
}

interface PaymentMethodsManagerProps {
  onSuccess?: () => void
}

export default function PaymentMethodsManager({ onSuccess }: PaymentMethodsManagerProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("BANK_ACCOUNT")

  // Form states for bank account
  const [bankAccountForm, setBankAccountForm] = useState({
    accountName: "",
    accountNumber: "",
    bankName: "",
    ifscCode: "",
    isDefault: false
  })

  // Form states for UPI
  const [upiForm, setUpiForm] = useState({
    upiId: "",
    upiName: "",
    phoneNumber: "",
    isDefault: false
  })

  // Fetch payment methods
  const fetchPaymentMethods = async () => {
    try {
      setError(null)
      const response = await fetch("/api/user/payment-methods")
      const data = await response.json()

      if (data.success) {
        setPaymentMethods(data.paymentMethods)
      } else {
        setError(data.error || "Failed to fetch payment methods")
      }
    } catch (error) {
      setError("Network error. Please try again.")
      console.error("Payment methods fetch error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  // Handle bank account form submission
  const handleBankAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/user/payment-methods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "BANK_ACCOUNT",
          ...bankAccountForm
        })
      })

      const data = await response.json()

      if (data.success) {
        setIsAddDialogOpen(false)
        setBankAccountForm({
          accountName: "",
          accountNumber: "",
          bankName: "",
          ifscCode: "",
          isDefault: false
        })
        fetchPaymentMethods()
        onSuccess?.()
      } else {
        setError(data.error || "Failed to add payment method")
      }
    } catch (error) {
      setError("Network error. Please try again.")
      console.error("Payment method creation error:", error)
    }
  }

  // Handle UPI form submission
  const handleUpiSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/user/payment-methods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "UPI",
          ...upiForm
        })
      })

      const data = await response.json()

      if (data.success) {
        setIsAddDialogOpen(false)
        setUpiForm({
          upiId: "",
          upiName: "",
          phoneNumber: "",
          isDefault: false
        })
        fetchPaymentMethods()
        onSuccess?.()
      } else {
        setError(data.error || "Failed to add payment method")
      }
    } catch (error) {
      setError("Network error. Please try again.")
      console.error("Payment method creation error:", error)
    }
  }

  // Handle delete payment method
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payment method?")) {
      return
    }

    try {
      const response = await fetch(`/api/user/payment-methods/${id}`, {
        method: "DELETE"
      })

      const data = await response.json()

      if (data.success) {
        fetchPaymentMethods()
        onSuccess?.()
      } else {
        setError(data.error || "Failed to delete payment method")
      }
    } catch (error) {
      setError("Network error. Please try again.")
      console.error("Payment method deletion error:", error)
    }
  }

  // Handle set as default
  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/user/payment-methods/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isDefault: true })
      })

      const data = await response.json()

      if (data.success) {
        fetchPaymentMethods()
        onSuccess?.()
      } else {
        setError(data.error || "Failed to update payment method")
      }
    } catch (error) {
      setError("Network error. Please try again.")
      console.error("Payment method update error:", error)
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
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Payment Methods</h3>
          <p className="text-sm text-muted-foreground">
            Manage your withdrawal payment methods
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
              <DialogDescription>
                Add a new payment method for withdrawals
              </DialogDescription>
            </DialogHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="BANK_ACCOUNT" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Bank Account
                </TabsTrigger>
                <TabsTrigger value="UPI" className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  UPI
                </TabsTrigger>
              </TabsList>

              <TabsContent value="BANK_ACCOUNT">
                <form onSubmit={handleBankAccountSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="accountName">Account Holder Name</Label>
                    <Input
                      id="accountName"
                      value={bankAccountForm.accountName}
                      onChange={(e) => setBankAccountForm(prev => ({ ...prev, accountName: e.target.value }))}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      value={bankAccountForm.accountNumber}
                      onChange={(e) => setBankAccountForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                      placeholder="1234567890"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      value={bankAccountForm.bankName}
                      onChange={(e) => setBankAccountForm(prev => ({ ...prev, bankName: e.target.value }))}
                      placeholder="State Bank of India"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ifscCode">IFSC Code</Label>
                    <Input
                      id="ifscCode"
                      value={bankAccountForm.ifscCode}
                      onChange={(e) => setBankAccountForm(prev => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))}
                      placeholder="SBIN0001234"
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isDefaultBank"
                      checked={bankAccountForm.isDefault}
                      onCheckedChange={(checked) => setBankAccountForm(prev => ({ ...prev, isDefault: checked }))}
                    />
                    <Label htmlFor="isDefaultBank">Set as default payment method</Label>
                  </div>
                  <Button type="submit" className="w-full">
                    Add Bank Account
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="UPI">
                <form onSubmit={handleUpiSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="upiId">UPI ID</Label>
                    <Input
                      id="upiId"
                      value={upiForm.upiId}
                      onChange={(e) => setUpiForm(prev => ({ ...prev, upiId: e.target.value.toLowerCase() }))}
                      placeholder="yourname@bank"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="upiName">UPI Holder Name</Label>
                    <Input
                      id="upiName"
                      value={upiForm.upiName}
                      onChange={(e) => setUpiForm(prev => ({ ...prev, upiName: e.target.value }))}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      value={upiForm.phoneNumber}
                      onChange={(e) => setUpiForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      placeholder="9876543210"
                      maxLength={10}
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isDefaultUpi"
                      checked={upiForm.isDefault}
                      onCheckedChange={(checked) => setUpiForm(prev => ({ ...prev, isDefault: checked }))}
                    />
                    <Label htmlFor="isDefaultUpi">Set as default payment method</Label>
                  </div>
                  <Button type="submit" className="w-full">
                    Add UPI Method
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Payment Methods List */}
      {paymentMethods.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="text-lg font-semibold mb-2">No Payment Methods</h4>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Add a payment method to start withdrawing funds
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Payment Method
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {paymentMethods.map((method) => (
            <Card key={method.id} className={!method.isActive ? "opacity-60" : ""}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 rounded-full bg-primary/10">
                      {method.type === "BANK_ACCOUNT" ? (
                        <Building2 className="h-6 w-6 text-primary" />
                      ) : (
                        <Smartphone className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">
                          {method.type === "BANK_ACCOUNT" ? method.bankName : "UPI"}
                        </h4>
                        {method.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                        {!method.isActive && (
                          <Badge variant="destructive" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      {method.type === "BANK_ACCOUNT" ? (
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Account Name: {method.accountName}</p>
                          <p>Account Number: {method.accountNumber}</p>
                          <p>IFSC: {method.ifscCode}</p>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>UPI ID: {method.upiId}</p>
                          <p>Name: {method.upiName}</p>
                          <p>Phone: {method.phoneNumber}</p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Added on {new Date(method.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!method.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(method.id)}
                      >
                        <Shield className="h-4 w-4 mr-1" />
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(method.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Your payment information is encrypted and stored securely. We never share your financial details with third parties.
        </AlertDescription>
      </Alert>
    </div>
  )
}