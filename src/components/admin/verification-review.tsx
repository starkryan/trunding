"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { UserAvatarWithFallback } from "@/components/ui/user-avatar"
import {
  CheckCircle,
  XCircle,
  Eye,
  Download,
  AlertTriangle,
  Calendar,
  IndianRupee,
  X
} from "lucide-react"
import { toast } from "sonner"

interface VerificationData {
  id: string
  utrNumber: string
  screenshotUrl: string
  verificationSubmittedAt: string
  verificationExpiresAt?: string | null
  amount: number
  currency: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  createdAt: string
  description?: string
  referenceId?: string
}

interface VerificationReviewProps {
  verification: VerificationData
  isOpen: boolean
  onClose: () => void
  onActionComplete?: () => void
}

export function VerificationReview({ verification, isOpen, onClose, onActionComplete }: VerificationReviewProps) {
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [showRejectionForm, setShowRejectionForm] = useState(false)

  const resetForm = () => {
    setAction(null)
    setAdminNotes('')
    setRejectionReason('')
    setShowRejectionForm(false)
    setLoading(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleApprove = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/transactions/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: verification.id,
          action: 'approve',
          adminNotes
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Transaction verified successfully!')
        onActionComplete?.()
        handleClose()
      } else {
        toast.error(result.error || 'Failed to approve transaction')
      }
    } catch (error) {
      console.error('Approval error:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is required')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/transactions/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: verification.id,
          action: 'reject',
          adminNotes,
          rejectionReason
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Transaction rejected successfully!')
        onActionComplete?.()
        handleClose()
      } else {
        toast.error(result.error || 'Failed to reject transaction')
      }
    } catch (error) {
      console.error('Rejection error:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const downloadImage = async () => {
    try {
      const response = await fetch(verification.screenshotUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `verification-${verification.id}-${Date.now()}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('Screenshot downloaded')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download screenshot')
    }
  }

  return (
    <Drawer open={isOpen} onOpenChange={handleClose}>
      <DrawerContent className="max-h-[95vh]">
        <DrawerHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DrawerTitle className="text-lg sm:text-xl">Review Transaction Verification</DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="px-4 pb-4 overflow-y-auto">
          <div className="text-sm text-muted-foreground mb-4">
            Review the submitted UTR and payment screenshot for verification
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {/* Left Column - Transaction Details */}
          <div className="space-y-6">
            {/* User Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <UserAvatarWithFallback
                    userId={verification.user.id}
                    name={verification.user.name}
                    email={verification.user.email}
                    size="sm"
                  />
                  <span className="truncate">{verification.user.name}</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm truncate">{verification.user.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-muted-foreground">User Role:</span>
                  <Badge variant="outline" className="text-xs">{verification.user.role}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-muted-foreground">User ID:</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {verification.user.id.slice(0, 8)}...
                  </code>
                </div>
              </CardContent>
            </Card>

            {/* Transaction Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Transaction Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Transaction ID:</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {verification.id.slice(0, 8)}...
                  </code>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-muted-foreground">Amount:</span>
                  <span className="font-medium text-green-600 flex items-center gap-1 text-sm sm:text-base">
                    <IndianRupee className="h-3 w-3 sm:h-4 sm:w-4" />
                    {verification.amount.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Currency:</span>
                  <span className="text-xs sm:text-sm">{verification.currency}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-muted-foreground">UTR Number:</span>
                  <code className="text-xs sm:text-sm bg-muted px-2 py-1 rounded font-mono break-all">
                    {verification.utrNumber}
                  </code>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                  <span className="text-xs sm:text-sm text-muted-foreground">Submitted At:</span>
                  <span className="text-xs sm:text-sm flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(verification.verificationSubmittedAt).toLocaleString('en-IN')}
                  </span>
                </div>
                {verification.verificationExpiresAt && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                    <span className="text-xs sm:text-sm text-muted-foreground">Expires At:</span>
                    <span className={`text-xs sm:text-sm flex items-center gap-1 ${
                      new Date(verification.verificationExpiresAt) < new Date(Date.now() + 24 * 60 * 60 * 1000)
                        ? 'text-orange-600 font-medium'
                        : 'text-muted-foreground'
                    }`}>
                      <AlertTriangle className="h-3 w-3" />
                      {new Date(verification.verificationExpiresAt).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                {verification.referenceId && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                    <span className="text-xs sm:text-sm text-muted-foreground">Reference ID:</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded break-all">
                      {verification.referenceId}
                    </code>
                  </div>
                )}
                {verification.description && (
                  <div>
                    <span className="text-xs sm:text-sm text-muted-foreground">Description:</span>
                    <p className="text-xs sm:text-sm mt-1">{verification.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Admin Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Admin Action</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showRejectionForm ? (
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button
                      onClick={() => setAction('approve')}
                      className="w-full sm:flex-1"
                      disabled={loading}
                      variant="default"
                      size="sm"
                    >
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => setShowRejectionForm(true)}
                      className="w-full sm:flex-1"
                      disabled={loading}
                      variant="destructive"
                      size="sm"
                    >
                      <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Please provide a reason for rejecting this verification.
                      </AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                      <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                      <Textarea
                        id="rejectionReason"
                        placeholder="Explain why this verification is being rejected..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Button
                        onClick={() => setShowRejectionForm(false)}
                        variant="outline"
                        className="w-full sm:flex-1"
                        disabled={loading}
                        size="sm"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleReject}
                        className="w-full sm:flex-1"
                        disabled={loading || !rejectionReason.trim()}
                        variant="destructive"
                        size="sm"
                      >
                        {loading ? 'Rejecting...' : 'Confirm Rejection'}
                      </Button>
                    </div>
                  </div>
                )}

                {action === 'approve' && (
                  <div className="space-y-4">
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Approving this verification will mark the transaction as verified and completed.
                      </AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                      <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
                      <Textarea
                        id="adminNotes"
                        placeholder="Add any notes about this verification..."
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Button
                        onClick={() => setAction(null)}
                        variant="outline"
                        className="w-full sm:flex-1"
                        disabled={loading}
                        size="sm"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleApprove}
                        className="w-full sm:flex-1"
                        disabled={loading}
                        size="sm"
                      >
                        {loading ? 'Approving...' : 'Confirm Approval'}
                      </Button>
                    </div>
                  </div>
                )}

                {!showRejectionForm && !action && (
                  <div className="space-y-2">
                    <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
                    <Textarea
                      id="adminNotes"
                      placeholder="Add any notes about this verification..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Screenshot */}
          <div className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="text-base sm:text-lg">Payment Screenshot</CardTitle>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(verification.screenshotUrl, '_blank')}
                      className="w-full sm:w-auto"
                    >
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      View Full
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadImage}
                      className="w-full sm:w-auto"
                    >
                      <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-xs sm:text-sm">
                  Review the payment screenshot for authenticity and correctness
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={verification.screenshotUrl}
                      alt="Payment screenshot"
                      className="w-full rounded-lg border"
                      style={{ maxHeight: '400px', objectFit: 'contain' }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground space-y-2">
                    <div className="flex flex-col gap-1">
                      <p className="break-words">
                        • Verify the UTR number matches:
                        <code className="bg-muted px-1 rounded ml-1 break-all">{verification.utrNumber}</code>
                      </p>
                      <p>• Check the payment amount: <span className="font-medium">₹{verification.amount.toLocaleString('en-IN')}</span></p>
                      <p>• Confirm the payment recipient and date</p>
                      <p>• Look for any signs of manipulation or editing</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}