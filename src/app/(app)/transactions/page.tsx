"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  FiArrowLeft,
  FiSearch,
  FiRefreshCw,
  FiDownload,
  FiEye,
  FiTrendingUp,
  FiTrendingDown,
  FiGift,
  FiCreditCard,
  FiActivity,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/context/auth-context";
import { Spinner } from "@/components/ui/spinner";
import { InputGroup, InputGroupAddon, InputGroupText } from "@/components/ui/input-group";

interface Transaction {
  id: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "TRADE_BUY" | "TRADE_SELL" | "REWARD" | "REFUND";
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  referenceId: string | null;
  metadata: any;
  createdAt: string;
}

interface TransactionStats {
  totalTransactions: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalRewards: number;
  completedTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  netBalance: number;
}

interface WalletData {
  balance: number;
  currency: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function TransactionsPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !session) {
      router.push("/signin");
    }
  }, [session, loading, router]);

  useEffect(() => {
    if (session) {
      fetchTransactions();
    }
  }, [session, currentPage, typeFilter, statusFilter, searchTerm]);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
      });

      if (typeFilter !== "all") params.append("type", typeFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchTerm) params.append("search", searchTerm);

      const [transactionsResponse, walletResponse] = await Promise.all([
        fetch(`/api/transactions?${params}`),
        fetch('/api/wallet')
      ]);
      
      if (!transactionsResponse.ok) {
        throw new Error("Failed to fetch transactions");
      }

      const data = await transactionsResponse.json();
      setTransactions(data.transactions);
      setStats(data.stats);
      setPagination(data.pagination);

      // Fetch wallet data
      if (walletResponse.ok) {
        const walletData = await walletResponse.json();
        if (walletData.success) {
          setWalletData(walletData.wallet);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-full text-xs font-medium">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            Success
          </div>
        );
      case "PENDING":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 rounded-full text-xs font-medium">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
            Pending
          </div>
        );
      case "FAILED":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-full text-xs font-medium">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
            Failed
          </div>
        );
      case "CANCELLED":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 rounded-full text-xs font-medium">
            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
            Cancelled
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 rounded-full text-xs font-medium">
            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
            {status}
          </div>
        );
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "DEPOSIT":
        return <FiTrendingUp className="h-4 w-4 text-green-600" />;
      case "WITHDRAWAL":
        return <FiTrendingDown className="h-4 w-4 text-red-600" />;
      case "TRADE_BUY":
        return <FiTrendingUp className="h-4 w-4 text-blue-600" />;
      case "TRADE_SELL":
        return <FiTrendingDown className="h-4 w-4 text-blue-600" />;
      case "REWARD":
        return <FiGift className="h-4 w-4 text-purple-600" />;
      case "REFUND":
        return <FiCreditCard className="h-4 w-4 text-orange-600" />;
      default:
        return <FiCreditCard className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "DEPOSIT":
        return "Deposit";
      case "WITHDRAWAL":
        return "Withdrawal";
      case "TRADE_BUY":
        return "Buy";
      case "TRADE_SELL":
        return "Sell";
      case "REWARD":
        return "Reward";
      case "REFUND":
        return "Refund";
      default:
        return type;
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const isPositive = type === "DEPOSIT" || type === "REWARD" || type === "TRADE_SELL";
    const sign = isPositive ? "+" : "-";
    return `${sign}₹${amount.toLocaleString()}`;
  };

  // Group transactions by date
  const groupTransactionsByDate = (transactions: Transaction[]) => {
    const groups: { [date: string]: Transaction[] } = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let dateLabel: string;
      if (date.toDateString() === today.toDateString()) {
        dateLabel = "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateLabel = "Yesterday";
      } else {
        dateLabel = date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
      
      if (!groups[dateLabel]) {
        groups[dateLabel] = [];
      }
      groups[dateLabel].push(transaction);
    });
    
    return groups;
  };

  const groupedTransactions = groupTransactionsByDate(transactions);

  // Show loading state while checking authentication
  if (loading || !mounted) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
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
        </div>
      </div>
    );
  }

  // Don't render if user is not authenticated
  if (!session) {
    return null;
  }

  return (
    <div className="h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      <Card className="flex-1 w-full rounded-none shadow-none border-0 bg-background sm:rounded-lg sm:shadow-lg sm:border sm:max-w-4xl mx-auto my-8 overflow-y-auto">


        <CardContent className="px-6 flex-1 flex flex-col space-y-6">
          {/* Current Wallet Balance */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Current Balance</h3>
                <p className="text-sm text-muted-foreground mt-1">Available for withdrawal</p>
              </div>
              <div className="text-right">
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Spinner variant="bars" size={16} />
                  </div>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-primary">
                      ₹{walletData?.balance.toLocaleString('en-IN', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      }) || '0.00'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {walletData?.currency || 'INR'}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 sm:p-6 rounded-lg bg-muted/30 border border-muted-foreground/20">
                <div className="flex justify-center mb-2">
                  <FiActivity className="h-5 w-5" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Balance</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold">₹{stats.netBalance.toLocaleString()}</p>
              </div>
              <div className="text-center p-4 sm:p-6 rounded-lg bg-muted/30 border border-muted-foreground/20">
                <div className="flex justify-center mb-2">
                  <FiTrendingUp className="h-5 w-5" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Deposits</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold">₹{stats.totalDeposits.toLocaleString()}</p>
              </div>
              <div className="text-center p-4 sm:p-6 rounded-lg bg-muted/30 border border-muted-foreground/20">
                <div className="flex justify-center mb-2">
                  <FiTrendingDown className="h-5 w-5" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Withdrawals</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold">₹{stats.totalWithdrawals.toLocaleString()}</p>
              </div>
              <div className="text-center p-4 sm:p-6 rounded-lg bg-muted/30 border border-muted-foreground/20">
                <div className="flex justify-center mb-2">
                  <FiGift className="h-5 w-5" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Rewards Earned</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold">₹{stats.totalRewards.toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Filters</h4>
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <InputGroup className="h-10">
                  <InputGroupAddon align="inline-start">
                    <InputGroupText>
                      <FiSearch className="h-4 w-4" />
                    </InputGroupText>
                  </InputGroupAddon>
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="border-0 bg-background"
                  />
                </InputGroup>
              </div>
              <Select value={typeFilter} onValueChange={(value) => {
                setTypeFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[140px] h-10">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="DEPOSIT">Deposit</SelectItem>
                  <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
                  <SelectItem value="TRADE_BUY">Buy</SelectItem>
                  <SelectItem value="TRADE_SELL">Sell</SelectItem>
                  <SelectItem value="REWARD">Reward</SelectItem>
                  <SelectItem value="REFUND">Refund</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[140px] h-10">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Divider */}
          <div className="relative w-full my-4" role="separator" aria-label="Transaction list">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted-foreground/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-3 text-muted-foreground">
                {stats?.totalTransactions || 0} transactions
              </span>
            </div>
          </div>

          {/* Transaction List */}
          <div className="flex-1 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner variant="bars" size={16} className="mr-2" />
                <span className="text-sm">Loading transactions...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8 text-red-600">
                <span className="text-sm">{error}</span>
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <div className="text-center">
                  <FiCreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No transactions found</p>
                  <p className="text-xs">Your transaction history will appear here</p>
                </div>
              </div>
            ) : (
              Object.entries(groupedTransactions).map(([dateLabel, dateTransactions]) => (
                <div key={dateLabel} className="space-y-3">
                  {/* Date Header */}
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{dateLabel}</h3>
                    <div className="flex-1 h-px bg-muted-foreground/20"></div>
                    <span className="text-xs text-muted-foreground">{dateTransactions.length} transaction{dateTransactions.length !== 1 ? 's' : ''}</span>
                  </div>
                  
                  {/* Transactions for this date */}
                  <div className="space-y-3">
                    {dateTransactions.map((transaction) => (
                      <Card key={transaction.id} className="hover:shadow-md transition-all duration-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            {/* Left side - Icon and Info */}
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="p-2 rounded-full bg-background shadow-sm flex-shrink-0">
                                {getTypeIcon(transaction.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {transaction.description || getTypeLabel(transaction.type)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(transaction.createdAt).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </p>
                                {transaction.referenceId && (
                                  <p className="text-xs text-muted-foreground mt-1 truncate">
                                    Ref: {transaction.referenceId}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            {/* Right side - Amount and Actions */}
                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                              <p className={`text-sm font-semibold ${
                                transaction.type === "DEPOSIT" || transaction.type === "REWARD" || transaction.type === "TRADE_SELL"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}>
                                {formatAmount(transaction.amount, transaction.type)}
                              </p>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(transaction.status)}
                                <Sheet>
                                  <SheetTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted-foreground/10 sm:hidden">
                                      <FiEye className="h-3 w-3" />
                                    </Button>
                                  </SheetTrigger>
                                  <SheetContent side="bottom" className="h-[85vh] sm:h-[80vh] max-h-[600px]">
                                    <SheetHeader className="pb-4">
                                      <SheetTitle className="text-lg">Transaction Details</SheetTitle>
                                      <SheetDescription className="text-sm">
                                        Complete information about this transaction
                                      </SheetDescription>
                                    </SheetHeader>
                                    <div className="flex-1 overflow-y-auto space-y-4 pb-6">
                                      {/* Amount and Status - Top Priority */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="p-4 bg-muted/50 rounded-lg">
                                          <p className="text-xs font-medium text-muted-foreground mb-1">Amount</p>
                                          <p className={`text-lg font-bold ${
                                            transaction.type === "DEPOSIT" || transaction.type === "REWARD" || transaction.type === "TRADE_SELL"
                                              ? "text-green-600"
                                              : "text-red-600"
                                          }`}>
                                            {formatAmount(transaction.amount, transaction.type)}
                                          </p>
                                        </div>
                                        <div className="p-4 bg-muted/50 rounded-lg">
                                          <p className="text-xs font-medium text-muted-foreground mb-2">Status</p>
                                          <div className="flex justify-center sm:justify-start mx-2">
                                            {getStatusBadge(transaction.status)}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Transaction Type and Date */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="p-4 bg-muted/50 rounded-lg">
                                          <p className="text-xs font-medium text-muted-foreground mb-1">Type</p>
                                          <div className="flex items-center gap-2">
                                            {getTypeIcon(transaction.type)}
                                            <span className="text-sm font-medium">{getTypeLabel(transaction.type)}</span>
                                          </div>
                                        </div>
                                        <div className="p-4 bg-muted/50 rounded-lg">
                                          <p className="text-xs font-medium text-muted-foreground mb-1">Date & Time</p>
                                          <p className="text-sm">
                                            {new Date(transaction.createdAt).toLocaleDateString()}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {new Date(transaction.createdAt).toLocaleTimeString()}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Reference ID */}
                                      {transaction.referenceId && (
                                        <div className="p-4 bg-muted/50 rounded-lg">
                                          <p className="text-xs font-medium text-muted-foreground mb-2">Reference ID</p>
                                          <div className="bg-background p-3 rounded border border-border">
                                            <p className="text-xs font-mono break-all">{transaction.referenceId}</p>
                                          </div>
                                        </div>
                                      )}

                                      {/* Description */}
                                      {transaction.description && (
                                        <div className="p-4 bg-muted/50 rounded-lg">
                                          <p className="text-xs font-medium text-muted-foreground mb-2">Description</p>
                                          <p className="text-sm leading-relaxed">{transaction.description}</p>
                                        </div>
                                      )}

                                      {/* Transaction ID */}
                                      <div className="p-4 bg-muted/50 rounded-lg">
                                        <p className="text-xs font-medium text-muted-foreground mb-2">Transaction ID</p>
                                        <div className="bg-background p-3 rounded border border-border">
                                          <p className="text-xs font-mono break-all">{transaction.id}</p>
                                        </div>
                                      </div>

                                      {/* Additional Actions */}
                                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                        <Button variant="outline" className="flex-1 text-sm">
                                          <FiDownload className="h-4 w-4 mr-2" />
                                          Download Receipt
                                        </Button>
                                        <Button variant="outline" className="flex-1 text-sm">
                                          <FiRefreshCw className="h-4 w-4 mr-2" />
                                          Refresh Status
                                        </Button>
                                      </div>
                                    </div>
                                  </SheetContent>
                                </Sheet>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted-foreground/10 hidden sm:flex">
                                      <FiEye className="h-3 w-3" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Transaction Details</DialogTitle>
                                      <DialogDescription>
                                        Complete information about this transaction
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <p className="text-sm font-medium">Transaction ID</p>
                                          <p className="text-sm text-muted-foreground">{transaction.id}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium">Type</p>
                                          <p className="text-sm text-muted-foreground">{getTypeLabel(transaction.type)}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium">Amount</p>
                                          <p className="text-sm text-muted-foreground">{formatAmount(transaction.amount, transaction.type)}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium">Status</p>
                                          <div className="mt-1">{getStatusBadge(transaction.status)}</div>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium">Date</p>
                                          <p className="text-sm text-muted-foreground">
                                            {new Date(transaction.createdAt).toLocaleString()}
                                          </p>
                                        </div>
                                        {transaction.referenceId && (
                                          <div>
                                            <p className="text-sm font-medium">Reference</p>
                                            <p className="text-sm text-muted-foreground">{transaction.referenceId}</p>
                                          </div>
                                        )}
                                      </div>
                                      {transaction.description && (
                                        <div>
                                          <p className="text-sm font-medium">Description</p>
                                          <p className="text-sm text-muted-foreground">{transaction.description}</p>
                                        </div>
                                      )}
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-muted-foreground/20">
              <div className="text-center sm:text-left">
                <p className="text-xs text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} transactions
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                    className="h-9 px-4 text-xs flex-1 sm:flex-none"
                  >
                    Previous
                  </Button>
                  <div className="px-3 py-1 bg-muted/50 rounded-md min-w-[80px] text-center">
                    <span className="text-xs text-muted-foreground font-medium">
                      {pagination.page} / {pagination.pages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                    className="h-9 px-4 text-xs flex-1 sm:flex-none"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
