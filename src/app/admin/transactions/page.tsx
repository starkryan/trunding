"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { VerificationReview } from "@/components/admin/verification-review";
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  Search,
  Download,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Activity,
  Wallet,
  IndianRupee,
  Copy,
  ChevronLeft,
  ChevronRight,
  Plus,
  Shield,
  AlertTriangle
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

interface Transaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "REWARD" | "TRADE_BUY" | "TRADE_SELL";
  status: "PENDING" | "COMPLETED" | "FAILED" | "PROCESSING";
  verificationStatus: "NONE" | "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";
  description: string;
  referenceId?: string;
  utrNumber?: string;
  screenshotUrl?: string;
  verificationSubmittedAt?: string;
  verificationProcessedAt?: string;
  verificationRejectedReason?: string;
  createdAt: string;
  updatedAt?: string; // Optional since it doesn't exist in database
  metadata: Record<string, any>;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  wallet: {
    id: string;
    currency: string;
  };
  method: string;
}

interface TransactionsResponse {
  success: boolean;
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  statistics: {
    totalTransactions: number;
    totalVolume: number;
    byStatus: {
      PENDING: number;
      COMPLETED: number;
      FAILED: number;
      PROCESSING: number;
    };
    byType: Record<string, { count: number; volume: number }>;
    dailyVolume: Array<{ date: string; volume: number; count: number }>;
    monthlyTrends: Array<{ month: string; deposits: number; withdrawals: number; net: number; count: number }>;
  };
  filters: {
    applied: {
      search?: string;
      status?: string;
      type?: string;
      method?: string;
      userId?: string;
      dateFrom?: string;
      dateTo?: string;
      minAmount?: number;
      maxAmount?: number;
    };
  };
}

export default function AdminTransactionsPage() {
  // State management
  const [transactionsResponse, setTransactionsResponse] = useState<TransactionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [verificationStatusFilter, setVerificationStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [minAmountFilter, setMinAmountFilter] = useState("");
  const [maxAmountFilter, setMaxAmountFilter] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);

  // Modal states
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch transactions from API
  const fetchTransactions = useCallback(async (page = 1, newFilters = {}, isExport = false) => {
    try {
      if (!isExport) {
        setLoading(true);
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...newFilters
      });

      const response = await fetch(`/api/admin/transactions?${params}`);
      const data: TransactionsResponse = await response.json();

      if (data.success) {
        setTransactionsResponse(data);
        setCurrentPage(data.pagination.page);
      } else {
        toast.error("Failed to fetch transactions");
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Network error. Please try again.");
    } finally {
      if (!isExport) {
        setLoading(false);
      }
    }
  }, [limit]);

  // Export transactions
  const exportTransactions = async () => {
    try {
      setExporting(true);

      const filters = {
        search: debouncedSearchTerm || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        verificationStatus: verificationStatusFilter !== "ALL" ? verificationStatusFilter : undefined,
        type: typeFilter !== "ALL" ? typeFilter : undefined,
        method: methodFilter !== "ALL" ? methodFilter : undefined,
        userId: userIdFilter || undefined,
        dateFrom: dateFromFilter || undefined,
        dateTo: dateToFilter || undefined,
        minAmount: minAmountFilter ? parseFloat(minAmountFilter) : undefined,
        maxAmount: maxAmountFilter ? parseFloat(maxAmountFilter) : undefined
      };

      const response = await fetch("/api/admin/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ format: "csv", filters }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success("Transactions exported successfully");
      } else {
        toast.error("Failed to export transactions");
      }
    } catch (error) {
      console.error("Error exporting transactions:", error);
      toast.error("Failed to export transactions");
    } finally {
      setExporting(false);
    }
  };

  // Auto-refresh and initial load - single effect for all data fetching
  useEffect(() => {
    const filters: Record<string, any> = {};

    if (debouncedSearchTerm) filters.search = debouncedSearchTerm;
    if (statusFilter !== "ALL") filters.status = statusFilter;
    if (verificationStatusFilter !== "ALL") filters.verificationStatus = verificationStatusFilter;
    if (typeFilter !== "ALL") filters.type = typeFilter;
    if (methodFilter !== "ALL") filters.method = methodFilter;
    if (userIdFilter) filters.userId = userIdFilter;
    if (dateFromFilter) filters.dateFrom = dateFromFilter;
    if (dateToFilter) filters.dateTo = dateToFilter;
    if (minAmountFilter) filters.minAmount = parseFloat(minAmountFilter);
    if (maxAmountFilter) filters.maxAmount = parseFloat(maxAmountFilter);

    fetchTransactions(currentPage, filters);

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchTransactions(currentPage, filters);
    }, 30000);

    return () => clearInterval(interval);
  }, [currentPage, debouncedSearchTerm, statusFilter, verificationStatusFilter, typeFilter, methodFilter, userIdFilter, dateFromFilter, dateToFilter, minAmountFilter, maxAmountFilter, fetchTransactions]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "FAILED":
        return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case "PROCESSING":
        return <Badge className="bg-blue-100 text-blue-700"><Activity className="h-3 w-3 mr-1" />Processing</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getVerificationStatusBadge = (status: string) => {
    switch (status) {
      case "NONE":
        return <Badge variant="outline">Not Submitted</Badge>;
      case "PENDING_VERIFICATION":
        return <Badge className="bg-yellow-100 text-yellow-700"><Shield className="h-3 w-3 mr-1" />Pending Review</Badge>;
      case "VERIFIED":
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "DEPOSIT":
        return <ArrowUpRight className="h-4 w-4 text-green-600" />;
      case "WITHDRAWAL":
        return <ArrowDownRight className="h-4 w-4 text-red-600" />;
      case "ADMIN_ADJUSTMENT_ADD":
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case "ADMIN_ADJUSTMENT_SUBTRACT":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case "REWARD":
        return <Wallet className="h-4 w-4 text-green-600" />;
      case "TRADE_BUY":
      case "TRADE_SELL":
        return <BarChart3 className="h-4 w-4 text-purple-600" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            Monitor and manage all financial transactions
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={exportTransactions}
            disabled={exporting}
          >
            <Download className="mr-2 h-4 w-4" />
            {exporting ? "Exporting..." : "Export CSV"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const filters: Record<string, any> = {};
              if (debouncedSearchTerm) filters.search = debouncedSearchTerm;
              if (statusFilter !== "ALL") filters.status = statusFilter;
              if (verificationStatusFilter !== "ALL") filters.verificationStatus = verificationStatusFilter;
              if (typeFilter !== "ALL") filters.type = typeFilter;
              if (methodFilter !== "ALL") filters.method = methodFilter;
              if (userIdFilter) filters.userId = userIdFilter;
              if (dateFromFilter) filters.dateFrom = dateFromFilter;
              if (dateToFilter) filters.dateTo = dateToFilter;
              if (minAmountFilter) filters.minAmount = parseFloat(minAmountFilter);
              if (maxAmountFilter) filters.maxAmount = parseFloat(maxAmountFilter);
              fetchTransactions(currentPage, filters, false);
            }}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {transactionsResponse?.statistics && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {transactionsResponse.statistics.totalTransactions.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  All time transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{transactionsResponse.statistics.totalVolume.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total transaction value
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {transactionsResponse.statistics.byStatus.COMPLETED.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Successfully processed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {transactionsResponse.statistics.byStatus.PENDING.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting processing
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Status and Type Breakdown */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transaction Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(transactionsResponse.statistics.byStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          status === 'COMPLETED' ? 'bg-green-500' :
                          status === 'PENDING' ? 'bg-yellow-500' :
                          status === 'FAILED' ? 'bg-red-500' :
                          status === 'PROCESSING' ? 'bg-blue-500' : 'bg-gray-500'
                        }`} />
                        <span className="text-sm font-medium capitalize">{status.replace('_', ' ')}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transaction Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(transactionsResponse.statistics.byType).map(([type, data]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          type.includes('DEPOSIT') || type.includes('REWARD') || type.includes('ADD') ? 'bg-green-500' :
                          type.includes('WITHDRAWAL') || type.includes('SUBTRACT') ? 'bg-red-500' :
                          type.includes('TRADE') ? 'bg-blue-500' : 'bg-gray-500'
                        }`} />
                        <span className="text-sm font-medium">{type.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{data.count.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">
                          ₹{data.volume.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Filters</CardTitle>
          <CardDescription>
            Filter transactions by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
              </SelectContent>
            </Select>
            <Select value={verificationStatusFilter} onValueChange={setVerificationStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Verification</SelectItem>
                <SelectItem value="NONE">Not Submitted</SelectItem>
                <SelectItem value="PENDING_VERIFICATION">Pending Review</SelectItem>
                <SelectItem value="VERIFIED">Verified</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="DEPOSIT">Deposit</SelectItem>
                <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
                <SelectItem value="ADMIN_ADJUSTMENT_ADD">Admin Adjustment (+)</SelectItem>
                <SelectItem value="ADMIN_ADJUSTMENT_SUBTRACT">Admin Adjustment (-)</SelectItem>
                <SelectItem value="REWARD">Reward</SelectItem>
                <SelectItem value="TRADE_BUY">Trade Buy</SelectItem>
                <SelectItem value="TRADE_SELL">Trade Sell</SelectItem>
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Methods</SelectItem>
                <SelectItem value="KukuPay">KukuPay</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
                <SelectItem value="System">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            List of all transactions in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>UTR</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    <div className="flex items-center justify-center">
                      <Spinner variant="bars" size={24} className="text-primary mr-2" />
                      Loading transactions...
                    </div>
                  </TableCell>
                </TableRow>
              ) : transactionsResponse?.transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                transactionsResponse?.transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium font-mono text-xs">
                      {transaction.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {transaction.user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{transaction.user.name}</p>
                          <p className="text-xs text-muted-foreground">{transaction.user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(transaction.type)}
                        <span className="capitalize text-sm">
                          {transaction.type.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className={
                        transaction.type.includes('DEPOSIT') ||
                        transaction.type.includes('REWARD') ||
                        transaction.type.includes('ADD')
                          ? 'text-green-600'
                          : 'text-red-600'
                      }>
                        {transaction.type.includes('DEPOSIT') ||
                         transaction.type.includes('REWARD') ||
                         transaction.type.includes('ADD')
                          ? '+' : '-'}
                        ₹{transaction.amount.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      {transaction.utrNumber ? (
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {transaction.utrNumber.slice(0, 6)}...
                        </code>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getVerificationStatusBadge(transaction.verificationStatus)}
                        {transaction.verificationRejectedReason && (
                          <p className="text-xs text-red-600" title={transaction.verificationRejectedReason}>
                            <AlertTriangle className="h-3 w-3 inline mr-1" />
                            Rejected
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {transaction.method}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(parseISO(transaction.createdAt), 'MMM dd, yyyy')}
                        <div className="text-xs text-muted-foreground">
                          {format(parseISO(transaction.createdAt), 'HH:mm a')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setDetailsModalOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {transaction.verificationStatus === 'PENDING_VERIFICATION' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setVerificationModalOpen(true);
                            }}
                            className="text-yellow-600 hover:text-yellow-700"
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {transactionsResponse?.pagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, transactionsResponse.pagination.total)} of{' '}
            {transactionsResponse.pagination.total} transactions
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              Page {currentPage} of {transactionsResponse.pagination.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(transactionsResponse.pagination.pages, prev + 1))}
              disabled={currentPage >= transactionsResponse.pagination.pages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              Complete information about this transaction
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-6">
              {/* Transaction Header */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Transaction ID</p>
                  <p className="font-mono text-sm">{selectedTransaction.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedTransaction.status)}</div>
                </div>
              </div>

              {/* User Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>
                        {selectedTransaction.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{selectedTransaction.user.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedTransaction.user.email}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User Role</p>
                  <Badge variant="outline" className="mt-1">
                    {selectedTransaction.user.role}
                  </Badge>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getTypeIcon(selectedTransaction.type)}
                    <span className="text-sm">
                      {selectedTransaction.type.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <p className={`text-lg font-bold mt-1 ${
                    selectedTransaction.type.includes('DEPOSIT') ||
                    selectedTransaction.type.includes('REWARD') ||
                    selectedTransaction.type.includes('ADD')
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {selectedTransaction.type.includes('DEPOSIT') ||
                     selectedTransaction.type.includes('REWARD') ||
                     selectedTransaction.type.includes('ADD')
                      ? '+' : '-'}
                    ₹{selectedTransaction.amount.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Method</p>
                  <Badge variant="outline" className="mt-1">
                    {selectedTransaction.method}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Currency</p>
                  <p className="text-sm mt-1">{selectedTransaction.currency}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="text-sm mt-1">
                    {format(parseISO(selectedTransaction.createdAt), 'PPpp')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Updated</p>
                  <p className="text-sm mt-1">
                    {selectedTransaction.updatedAt
                      ? format(parseISO(selectedTransaction.updatedAt), 'PPpp')
                      : format(parseISO(selectedTransaction.createdAt), 'PPpp')
                    }
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedTransaction.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-sm mt-1">{selectedTransaction.description}</p>
                </div>
              )}

              {/* Reference ID */}
              {selectedTransaction.referenceId && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reference ID</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm font-mono">{selectedTransaction.referenceId}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (selectedTransaction.referenceId) {
                          navigator.clipboard.writeText(selectedTransaction.referenceId);
                          toast.success('Reference ID copied to clipboard');
                        }
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Metadata */}
              {selectedTransaction.metadata && Object.keys(selectedTransaction.metadata).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Additional Information</p>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(selectedTransaction.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Verification Review Modal */}
      {selectedTransaction && (
        <VerificationReview
          verification={{
            id: selectedTransaction.id,
            utrNumber: selectedTransaction.utrNumber || '',
            screenshotUrl: selectedTransaction.screenshotUrl || '',
            verificationSubmittedAt: selectedTransaction.verificationSubmittedAt || selectedTransaction.createdAt,
            amount: selectedTransaction.amount,
            currency: selectedTransaction.currency,
            user: selectedTransaction.user,
            createdAt: selectedTransaction.createdAt,
            description: selectedTransaction.description,
            referenceId: selectedTransaction.referenceId
          }}
          isOpen={verificationModalOpen}
          onClose={() => setVerificationModalOpen(false)}
          onActionComplete={() => {
            fetchTransactions(currentPage, {
              search: debouncedSearchTerm,
              status: statusFilter !== "ALL" ? statusFilter : undefined,
              type: typeFilter !== "ALL" ? typeFilter : undefined,
              method: methodFilter !== "ALL" ? methodFilter : undefined,
              userId: userIdFilter,
              dateFrom: dateFromFilter,
              dateTo: dateToFilter,
              minAmount: minAmountFilter ? parseFloat(minAmountFilter) : undefined,
              maxAmount: maxAmountFilter ? parseFloat(maxAmountFilter) : undefined
            });
          }}
        />
      )}
    </div>
  );
}