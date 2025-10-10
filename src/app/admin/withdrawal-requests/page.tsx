"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Building2,
  Smartphone,
  CreditCard,
  DollarSign,
  Users,
  Calendar,
  MoreHorizontal,
  Ban,
  Check,
  AlertCircle
} from "lucide-react"

interface WithdrawalRequest {
  id: string
  userId: string
  amount: number
  currency: string
  status: "PENDING" | "APPROVED" | "REJECTED" | "PROCESSING" | "COMPLETED" | "FAILED"
  adminNotes?: string
  processedBy?: string
  processedAt?: string
  rejectionReason?: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
  }
  withdrawalMethod: {
    id: string
    type: "BANK_ACCOUNT" | "UPI"
    accountName?: string
    accountNumber?: string
    bankName?: string
    ifscCode?: string
    upiId?: string
    upiName?: string
    phoneNumber?: string
  }
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

export default function AdminWithdrawalRequestsPage() {
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  // Action form states
  const [actionNotes, setActionNotes] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")

  // Fetch withdrawal requests
  const fetchWithdrawalRequests = async (page = 1, status = "all") => {
    try {
      setError(null)
      setIsLoading(true)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(status !== "all" && { status })
      })

      const response = await fetch(`/api/admin/withdrawal-requests?${params}`)
      const data = await response.json()

      if (data.success) {
        setWithdrawalRequests(data.withdrawalRequests)
        setPagination(data.pagination)
        setCurrentPage(data.pagination.page)
      } else {
        setError(data.error || "Failed to fetch withdrawal requests")
      }
    } catch (error) {
      setError("Network error. Please try again.")
      console.error("Withdrawal requests fetch error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWithdrawalRequests(currentPage, statusFilter)
  }, [currentPage, statusFilter])

  // Filter requests based on search term
  const filteredRequests = withdrawalRequests.filter(request =>
    request.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (request.withdrawalMethod.type === "BANK_ACCOUNT"
      ? request.withdrawalMethod.bankName?.toLowerCase().includes(searchTerm.toLowerCase())
      : request.withdrawalMethod.upiId?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  // Get status badge
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

  // Handle withdrawal request action (approve/reject)
  const handleAction = async (requestId: string, action: "APPROVED" | "REJECTED") => {
    if (!selectedRequest) return

    try {
      setIsProcessing(true)
      setError(null)

      const response = await fetch(`/api/admin/withdrawal-requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: action,
          adminNotes: actionNotes,
          rejectionReason: action === "REJECTED" ? rejectionReason : undefined
        })
      })

      const data = await response.json()

      if (data.success) {
        fetchWithdrawalRequests(currentPage, statusFilter)
        setIsDetailDialogOpen(false)
        setSelectedRequest(null)
        setActionNotes("")
        setRejectionReason("")
      } else {
        setError(data.error || "Failed to process withdrawal request")
      }
    } catch (error) {
      setError("Network error. Please try again.")
      console.error("Withdrawal request action error:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  // View request details
  const viewRequestDetails = async (requestId: string) => {
    try {
      const response = await fetch(`/api/admin/withdrawal-requests/${requestId}`)
      const data = await response.json()

      if (data.success) {
        setSelectedRequest(data.withdrawalRequest)
        setIsDetailDialogOpen(true)
      } else {
        setError(data.error || "Failed to fetch request details")
      }
    } catch (error) {
      setError("Network error. Please try again.")
      console.error("Request details fetch error:", error)
    }
  }

  // Statistics
  const stats = {
    total: withdrawalRequests.length,
    pending: withdrawalRequests.filter(r => r.status === "PENDING").length,
    approved: withdrawalRequests.filter(r => r.status === "APPROVED").length,
    rejected: withdrawalRequests.filter(r => r.status === "REJECTED").length,
    totalAmount: withdrawalRequests.reduce((sum, r) => sum + r.amount, 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Withdrawal Requests</h1>
          <p className="text-muted-foreground">
            Manage and process user withdrawal requests
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm" onClick={() => fetchWithdrawalRequests(currentPage, statusFilter)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All withdrawal requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">
              Approved requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">
              Rejected requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(stats.totalAmount / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground">
              Total withdrawal amount
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter withdrawal requests by status and search
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value)
              setCurrentPage(1)
            }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Withdrawal Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Requests</CardTitle>
          <CardDescription>
            List of all user withdrawal requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner variant="bars" size={24} className="text-primary" />
              <span className="ml-2 text-muted-foreground">Loading withdrawal requests...</span>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-semibold mb-2">No withdrawal requests found</h4>
              <p className="text-sm text-muted-foreground">
                {searchTerm || statusFilter !== "all"
                  ? "No requests match your current filters"
                  : "No withdrawal requests have been made yet"
                }
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.id.slice(0, 8)}...</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={`/placeholder-avatar.jpg`} alt={request.user.name} />
                            <AvatarFallback>{request.user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{request.user.name}</p>
                            <p className="text-xs text-muted-foreground">{request.user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ₹{request.amount.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {request.withdrawalMethod.type === "BANK_ACCOUNT" ? (
                            <Building2 className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Smartphone className="h-4 w-4 text-green-600" />
                          )}
                          <span className="text-sm">
                            {request.withdrawalMethod.type === "BANK_ACCOUNT"
                              ? request.withdrawalMethod.bankName
                              : "UPI"
                            }
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(request.createdAt).toLocaleDateString()}
                          <div className="text-xs text-muted-foreground">
                            {new Date(request.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewRequestDetails(request.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between px-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} results
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Request Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle>Withdrawal Request Details</DialogTitle>
                <DialogDescription>
                  Review and process withdrawal request #{selectedRequest.id.slice(0, 8)}...
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">User Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={`/placeholder-avatar.jpg`} alt={selectedRequest.user.name} />
                        <AvatarFallback>{selectedRequest.user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{selectedRequest.user.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedRequest.user.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">User ID</p>
                        <p className="font-medium">{selectedRequest.userId.slice(0, 8)}...</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Member Since</p>
                        <p className="font-medium">Jan 2024</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Withdrawal Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Withdrawal Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold">₹{selectedRequest.amount.toLocaleString('en-IN')}</p>
                      <p className="text-sm text-muted-foreground">{selectedRequest.currency}</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span>{getStatusBadge(selectedRequest.status)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Requested:</span>
                        <span>{new Date(selectedRequest.createdAt).toLocaleString()}</span>
                      </div>
                      {selectedRequest.processedAt && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Processed:</span>
                          <span>{new Date(selectedRequest.processedAt).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Method</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-full bg-primary/10">
                        {selectedRequest.withdrawalMethod.type === "BANK_ACCOUNT" ? (
                          <Building2 className="h-6 w-6 text-primary" />
                        ) : (
                          <Smartphone className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold">
                          {selectedRequest.withdrawalMethod.type === "BANK_ACCOUNT"
                            ? "Bank Account"
                            : "UPI"
                          }
                        </h4>
                        {selectedRequest.withdrawalMethod.type === "BANK_ACCOUNT" ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Account Name:</span>
                              <p className="font-medium">{selectedRequest.withdrawalMethod.accountName}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Account Number:</span>
                              <p className="font-medium">{selectedRequest.withdrawalMethod.accountNumber}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Bank Name:</span>
                              <p className="font-medium">{selectedRequest.withdrawalMethod.bankName}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">IFSC Code:</span>
                              <p className="font-medium">{selectedRequest.withdrawalMethod.ifscCode}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">UPI ID:</span>
                              <p className="font-medium">{selectedRequest.withdrawalMethod.upiId}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">UPI Name:</span>
                              <p className="font-medium">{selectedRequest.withdrawalMethod.upiName}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Phone Number:</span>
                              <p className="font-medium">{selectedRequest.withdrawalMethod.phoneNumber}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Admin Notes */}
                {selectedRequest.adminNotes && (
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Admin Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{selectedRequest.adminNotes}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Rejection Reason */}
                {selectedRequest.rejectionReason && (
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-lg text-red-600">Rejection Reason</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-red-600">{selectedRequest.rejectionReason}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Action Buttons */}
              {selectedRequest.status === "PENDING" && (
                <div className="space-y-4 mt-6 pt-6 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
                    <Textarea
                      id="adminNotes"
                      placeholder="Add any notes about this withdrawal request..."
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAction(selectedRequest.id, "APPROVED")}
                      disabled={isProcessing}
                      className="flex-1"
                    >
                      {isProcessing ? (
                        <>
                          <Spinner variant="bars" size={16} className="mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve Request
                        </>
                      )}
                    </Button>

                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (!rejectionReason.trim()) {
                          setError("Please provide a rejection reason")
                          return
                        }
                        handleAction(selectedRequest.id, "REJECTED")
                      }}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Spinner variant="bars" size={16} className="mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                    <Textarea
                      id="rejectionReason"
                      placeholder="Provide a reason for rejection..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={2}
                      className={selectedRequest.status === "PENDING" ? "border-red-200" : ""}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}