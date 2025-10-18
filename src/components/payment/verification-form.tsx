"use client"

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Upload, CheckCircle, AlertCircle, X, Eye } from "lucide-react"
import { toast } from "sonner"

interface Transaction {
  id: string
  amount: number
  currency: string
  type: string
  status: string
  verificationStatus: string
  createdAt: string
  verificationExpiresAt?: string | null
  verificationSubmittedAt?: string | null
}

interface VerificationFormProps {
  transaction: Transaction
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function VerificationForm({ transaction, isOpen, onClose, onSuccess }: VerificationFormProps) {
  const [utrNumber, setUtrNumber] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset form when opening
  const handleOpen = () => {
    setUtrNumber('')
    setScreenshot(null)
    setPreviewUrl(null)
    setDragActive(false)
  }

  // Handle file selection
  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are allowed')
      return
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB')
      return
    }

    setScreenshot(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  // Remove selected file
  const removeFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setScreenshot(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Validate UTR number
  const validateUtr = (value: string) => {
    return /^\d{12}$/.test(value)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!utrNumber) {
      toast.error('UTR number is required')
      return
    }

    if (!validateUtr(utrNumber)) {
      toast.error('UTR number must be exactly 12 digits')
      return
    }

    if (!screenshot) {
      toast.error('Payment screenshot is required')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('transactionId', transaction.id)
      formData.append('utrNumber', utrNumber)
      formData.append('screenshot', screenshot)

      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Verification submitted successfully!')
        onSuccess?.()
        onClose()
      } else {
        toast.error(result.error || 'Failed to submit verification')
      }
    } catch (error) {
      console.error('Verification submission error:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getVerificationStatusBadge = (status: string) => {
    switch (status) {
      case 'NONE':
        return <Badge variant="outline" className="border-blue-200 text-blue-700">Not Submitted</Badge>
      case 'PENDING_VERIFICATION':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Pending Review</Badge>
      case 'VERIFIED':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Verified ✓</Badge>
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Rejected ✗</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DrawerTitle>Submit Payment Verification</DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-6 overflow-y-auto">
          {/* Transaction Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Transaction Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Amount:</span>
                <span className="font-medium">₹{transaction.amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Date:</span>
                <span className="text-sm">
                  {new Date(transaction.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                {getVerificationStatusBadge(transaction.verificationStatus)}
              </div>
              {transaction.verificationExpiresAt && transaction.verificationStatus === 'PENDING_VERIFICATION' && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Expires:</span>
                  <span className={`text-sm ${
                    new Date(transaction.verificationExpiresAt) < new Date(Date.now() + 24 * 60 * 60 * 1000)
                      ? 'text-orange-600 font-medium'
                      : 'text-muted-foreground'
                  }`}>
                    {new Date(transaction.verificationExpiresAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
              )}

              {/* Show transaction age warning for very old transactions */}
              {(() => {
                const transactionAge = Date.now() - new Date(transaction.createdAt).getTime()
                const daysOld = Math.floor(transactionAge / (1000 * 60 * 60 * 24))

                if (daysOld > 30) {
                  return (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Transaction Age:</span>
                      <span className="text-sm text-orange-600 font-medium">
                        {daysOld} days old
                      </span>
                    </div>
                  )
                }
                return null
              })()}
            </CardContent>
          </Card>

          {transaction.verificationStatus !== 'NONE' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {transaction.verificationStatus === 'PENDING_VERIFICATION'
                  ? `This transaction has a verification submitted and is currently under review.${
                      transaction.verificationExpiresAt
                        ? ` It expires on ${new Date(transaction.verificationExpiresAt).toLocaleDateString('en-IN')}.`
                        : ''
                    }`
                  : transaction.verificationStatus === 'REJECTED'
                  ? 'This verification was rejected. You can submit a new verification.'
                  : 'Please contact support if you have questions about this transaction.'
                }
              </AlertDescription>
            </Alert>
          )}

          {transaction.verificationStatus === 'NONE' && (
            <>
              {/* Alert for old transactions */}
              {(() => {
                const transactionAge = Date.now() - new Date(transaction.createdAt).getTime()
                const daysOld = Math.floor(transactionAge / (1000 * 60 * 60 * 24))

                if (daysOld > 30) {
                  return (
                    <Alert className="border-orange-200 bg-orange-50">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800">
                        This transaction is {daysOld} days old. Please ensure you have the correct payment details and UTR number before submitting verification.
                      </AlertDescription>
                    </Alert>
                  )
                }
                return null
              })()}

              <form id="verification-form" onSubmit={handleSubmit} className="space-y-6">
              {/* UTR Number Input */}
              <div className="space-y-2">
                <Label htmlFor="utr">UTR Number *</Label>
                <Input
                  id="utr"
                  type="text"
                  placeholder="Enter 12-digit UTR number"
                  value={utrNumber}
                  onChange={(e) => {
                    // Only allow digits
                    const value = e.target.value.replace(/\D/g, '')
                    if (value.length <= 12) {
                      setUtrNumber(value)
                    }
                  }}
                  maxLength={12}
                  pattern="\d{12}"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter the 12-digit UTR number from your payment confirmation
                </p>
              </div>

              {/* Screenshot Upload */}
              <div className="space-y-2">
                <Label>Payment Screenshot *</Label>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />

                  {!screenshot ? (
                    <div className="space-y-2">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          Drop your screenshot here or click to browse
                        </p>
                        <p className="text-xs text-muted-foreground">
                          JPEG, PNG, or WebP (max 5MB)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative">
                        <img
                          src={previewUrl!}
                          alt="Payment screenshot"
                          className="mx-auto max-h-64 rounded-lg object-contain"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={removeFile}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">{screenshot.name}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewUrl(previewUrl)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              </form>
            </>
          )}
        </div>

        {/* Submit Buttons */}
        {transaction.verificationStatus === 'NONE' && (
          <DrawerFooter className="px-4 pt-0">
            <div className="flex gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="verification-form"
                className="flex-1"
                disabled={loading || !utrNumber || !screenshot || !validateUtr(utrNumber)}
              >
                {loading ? 'Submitting...' : 'Submit Verification'}
              </Button>
            </div>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  )
}