"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import {
  FaUniversity,
  FaCreditCard,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaExclamationTriangle,
  FaMobileAlt,
  FaMoneyBill,
  FaShieldAlt,
  FaUser,
  FaPhone,
  FaHashtag,
  FaMapMarkerAlt,
  FaAt,
  FaUserCheck,
  FaPhoneAlt,
  FaLandmark
} from "react-icons/fa"

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

interface ValidationError {
  field: string
  message: string
}

export default function PaymentMethodsManager({ onSuccess }: PaymentMethodsManagerProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("BANK_ACCOUNT")
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])

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

  // Cleanup function to prevent memory leaks
  useEffect(() => {
    return () => {
      // Reset states when component unmounts
      setValidationErrors([])
      setError(null)
      setIsLoading(true)
    }
  }, [])

  // Handle bank account form submission
  const handleBankAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setValidationErrors([])

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
        setError(null)
        setValidationErrors([])
        fetchPaymentMethods()
        onSuccess?.()
      } else {
        if (data.details) {
          setValidationErrors(data.details)
        } else {
          setError(data.error || "Failed to add payment method")
        }
      }
    } catch (error) {
      setError("Network error. Please try again.")
      console.error("Payment method creation error:", error)
    }
  }

  // Handle UPI form submission
  const handleUpiSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setValidationErrors([])

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
        setError(null)
        setValidationErrors([])
        fetchPaymentMethods()
        onSuccess?.()
      } else {
        if (data.details) {
          setValidationErrors(data.details)
        } else {
          setError(data.error || "Failed to add payment method")
        }
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

  // Helper function to check if field has validation error
  const getFieldError = (fieldName: string) => {
    return validationErrors.find(err => err.field === fieldName)
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
    <div className="space-y-4 sm:space-y-6">
      {error && (
        <Alert variant="destructive">
          <FaExclamationTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}



      {/* Payment Methods List */}
      {paymentMethods.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
            <FaCreditCard className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
            <h4 className="text-base sm:text-lg font-semibold mb-2 text-center">No Payment Methods</h4>
            <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
              Add a payment method to start withdrawing funds
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
              <FaPlus className="h-4 w-4 mr-2" />
              Add Your First Payment Method
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {paymentMethods.map((method) => (
            <Card key={method.id} className={!method.isActive ? "opacity-60" : ""}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="p-2 rounded-full bg-primary/10 flex-shrink-0">
                      {method.type === "BANK_ACCOUNT" ? (
                        <FaUniversity className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      ) : (
                        <FaMobileAlt className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      )}
                    </div>
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-base sm:text-lg truncate">
                          {method.type === "BANK_ACCOUNT" ? method.bankName : "UPI"}
                        </h4>
                        {method.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            <FaCheckCircle className="h-3 w-3 mr-1" />
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
                          <p className="break-words">
                            <span className="font-medium">Account Name:</span> {method.accountName}
                          </p>
                          <p className="break-words">
                            <span className="font-medium">Account Number:</span> {method.accountNumber}
                          </p>
                          <p className="break-words">
                            <span className="font-medium">IFSC:</span> {method.ifscCode}
                          </p>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p className="break-words">
                            <span className="font-medium">UPI ID:</span> {method.upiId}
                          </p>
                          <p className="break-words">
                            <span className="font-medium">Name:</span> {method.upiName}
                          </p>
                          <p className="break-words">
                            <span className="font-medium">Phone:</span> {method.phoneNumber}
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Added on {new Date(method.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-2 flex-shrink-0">
                    {!method.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(method.id)}
                        className="text-xs px-2 py-1 h-auto sm:text-sm sm:px-3 sm:py-2"
                      >
                        <FaShieldAlt className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden sm:inline">Set Default</span>
                        <span className="sm:hidden">Default</span>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(method.id)}
                      className="text-xs px-2 py-1 h-auto sm:text-sm sm:px-3 sm:py-2"
                    >
                      <FaTrash className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Payment Method Dialog */}
      <Dialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open)
          if (!open) {
            setValidationErrors([])
            setError(null)
          }
        }}
      >
        <DialogTrigger asChild>
          {paymentMethods.length > 0 && (
            <Button className="w-full sm:w-auto">
              <FaPlus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
          </DialogHeader>

          <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value)
            setValidationErrors([])
            setError(null)
          }}
          className="w-full"
        >
            <TabsList className="grid w-full grid-cols-2 p-1 bg-muted rounded-lg">
              <TabsTrigger
                value="BANK_ACCOUNT"
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"
              >
                <FaUniversity className="h-4 w-4" />
                Bank Account
              </TabsTrigger>
              <TabsTrigger
                value="UPI"
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"
              >
                <FaMobileAlt className="h-4 w-4" />
                UPI
              </TabsTrigger>
            </TabsList>

            <TabsContent value="BANK_ACCOUNT">
              <form onSubmit={handleBankAccountSubmit} className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="accountName" className="flex items-center gap-2">
                      <FaUser className="h-4 w-4 text-muted-foreground" />
                      Account Holder Name
                    </Label>
                    <Input
                      id="accountName"
                      value={bankAccountForm.accountName}
                      onChange={(e) => setBankAccountForm(prev => ({ ...prev, accountName: e.target.value }))}
                      placeholder="John Doe"
                      required
                      className={getFieldError("accountName") ? "border-red-500 focus:border-red-500" : ""}
                    />
                    {getFieldError("accountName") && (
                      <p className="text-sm text-red-500">{getFieldError("accountName")?.message}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="accountNumber" className="flex items-center gap-2">
                      <FaHashtag className="h-4 w-4 text-muted-foreground" />
                      Account Number
                    </Label>
                    <Input
                      id="accountNumber"
                      value={bankAccountForm.accountNumber}
                      onChange={(e) => setBankAccountForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                      placeholder="1234567890123456"
                      required
                      className={getFieldError("accountNumber") ? "border-red-500 focus:border-red-500" : ""}
                    />
                    {getFieldError("accountNumber") && (
                      <p className="text-sm text-red-500">{getFieldError("accountNumber")?.message}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bankName" className="flex items-center gap-2">
                      <FaLandmark className="h-4 w-4 text-muted-foreground" />
                      Bank Name
                    </Label>
                    <Input
                      id="bankName"
                      value={bankAccountForm.bankName}
                      onChange={(e) => setBankAccountForm(prev => ({ ...prev, bankName: e.target.value }))}
                      placeholder="State Bank of India"
                      required
                      className={getFieldError("bankName") ? "border-red-500 focus:border-red-500" : ""}
                    />
                    {getFieldError("bankName") && (
                      <p className="text-sm text-red-500">{getFieldError("bankName")?.message}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="ifscCode" className="flex items-center gap-2">
                        <FaMapMarkerAlt className="h-4 w-4 text-muted-foreground" />
                        IFSC Code
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {bankAccountForm.ifscCode.length}/11
                      </span>
                    </div>
                    <Input
                      id="ifscCode"
                      value={bankAccountForm.ifscCode}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11)
                        setBankAccountForm(prev => ({ ...prev, ifscCode: value }))
                      }}
                      placeholder="SBIN0001234"
                      maxLength={11}
                      pattern="[A-Z]{4}0[A-Z0-9]{6}"
                      required
                      className={getFieldError("ifscCode") ? "border-red-500 focus:border-red-500" : ""}
                    />
                    {getFieldError("ifscCode") && (
                      <p className="text-sm text-red-500">{getFieldError("ifscCode")?.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Enter 11-character IFSC code (e.g., SBIN0001234)</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isDefaultBank"
                      checked={bankAccountForm.isDefault}
                      onCheckedChange={(checked) => setBankAccountForm(prev => ({ ...prev, isDefault: checked }))}
                    />
                    <Label htmlFor="isDefaultBank">Set as default payment method</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    className="flex items-center gap-2"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex items-center gap-2">
                    <FaUniversity className="h-4 w-4" />
                    Add Bank Account
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="UPI">
              <form onSubmit={handleUpiSubmit} className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="upiId" className="flex items-center gap-2">
                      <FaAt className="h-4 w-4 text-muted-foreground" />
                      UPI ID
                    </Label>
                    <Input
                      id="upiId"
                      value={upiForm.upiId}
                      onChange={(e) => setUpiForm(prev => ({ ...prev, upiId: e.target.value.toLowerCase() }))}
                      placeholder="john@paytm"
                      required
                      className={getFieldError("upiId") ? "border-red-500 focus:border-red-500" : ""}
                    />
                    {getFieldError("upiId") && (
                      <p className="text-sm text-red-500">{getFieldError("upiId")?.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Enter UPI ID in format: username@paytm</p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="upiName" className="flex items-center gap-2">
                      <FaUserCheck className="h-4 w-4 text-muted-foreground" />
                      Account Holder Name
                    </Label>
                    <Input
                      id="upiName"
                      value={upiForm.upiName}
                      onChange={(e) => setUpiForm(prev => ({ ...prev, upiName: e.target.value }))}
                      placeholder="John Doe"
                      required
                      className={getFieldError("upiName") ? "border-red-500 focus:border-red-500" : ""}
                    />
                    {getFieldError("upiName") && (
                      <p className="text-sm text-red-500">{getFieldError("upiName")?.message}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                        <FaPhoneAlt className="h-4 w-4 text-muted-foreground" />
                        Phone Number
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {upiForm.phoneNumber.length}/10
                      </span>
                    </div>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={upiForm.phoneNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                        setUpiForm(prev => ({ ...prev, phoneNumber: value }))
                      }}
                      placeholder="9876543210"
                      maxLength={10}
                      pattern="[0-9]{10}"
                      required
                      className={getFieldError("phoneNumber") ? "border-red-500 focus:border-red-500" : ""}
                    />
                    {getFieldError("phoneNumber") && (
                      <p className="text-sm text-red-500">{getFieldError("phoneNumber")?.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Enter 10-digit mobile number starting with 6-9</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isDefaultUpi"
                      checked={upiForm.isDefault}
                      onCheckedChange={(checked) => setUpiForm(prev => ({ ...prev, isDefault: checked }))}
                    />
                    <Label htmlFor="isDefaultUpi">Set as default payment method</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    className="flex items-center gap-2"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex items-center gap-2">
                    <FaMobileAlt className="h-4 w-4" />
                    Add UPI Method
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Security Notice */}
      <Alert className="text-sm">
        <FaShieldAlt className="h-4 w-4 flex-shrink-0" />
        <AlertDescription className="text-xs sm:text-sm">
          Your payment information is encrypted and stored securely. We never share your financial details with third parties.
        </AlertDescription>
      </Alert>
    </div>
  )
}