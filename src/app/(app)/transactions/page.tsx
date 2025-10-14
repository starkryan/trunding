"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  FiFilter,
  FiRefreshCw,
  FiDownload,
  FiEye,
  FiTrendingUp,
  FiTrendingDown,
  FiGift,
  FiCreditCard,
  FiX,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sheet } from "react-modal-sheet";
import { useAuth } from "@/context/auth-context";
import { Spinner } from "@/components/ui/spinner";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
} from "@/components/ui/input-group";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  type:
    | "DEPOSIT"
    | "WITHDRAWAL"
    | "REWARD"
    | "REFUND";
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
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

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
  }, [session, currentPage, typeFilter, statusFilter]);

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

      const [transactionsResponse, walletResponse] = await Promise.all([
        fetch(`/api/transactions?${params}`),
        fetch("/api/wallet"),
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
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 text-xs font-medium">
            
            Success
          </div>
        );
      case "PENDING":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 text-xs font-medium">
            Pending
          </div>
        );
      case "PROCESSING":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 text-xs font-medium">
           
            Processing
          </div>
        );
      case "APPROVED":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 text-xs font-medium">
            
            Approved
          </div>
        );
      case "FAILED":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 text-xs font-medium">
            
            Failed
          </div>
        );
      case "REJECTED":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 text-xs font-medium">
        
            Rejected
          </div>
        );
      case "CANCELLED":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 text-xs font-medium">
          
            Cancelled
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 text-xs font-medium">
            <div className="w-1.5 h-1.5 bg-gray-500"></div>
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
  
      case "REWARD":
        return <FiGift className="h-4 w-4 text-yellow-400" />;
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
   
      case "REWARD":
        return "Reward";
      case "REFUND":
        return "Refund";
      default:
        return type;
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const isPositive =
      type === "DEPOSIT" || type === "REWARD" || type === "TRADE_SELL";
    const sign = isPositive ? "+" : "-";
    return `${sign}₹${amount.toLocaleString()}`;
  };

  // Utility functions for sheet display
  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400";
      case "PENDING":
        return "bg-amber-100 text-amber-700 ring-amber-600/20 dark:bg-amber-900/20 dark:text-amber-400";
      case "PROCESSING":
        return "bg-blue-100 text-blue-700 ring-blue-600/20 dark:bg-blue-900/20 dark:text-blue-400";
      case "APPROVED":
        return "bg-purple-100 text-purple-700 ring-purple-600/20 dark:bg-purple-900/20 dark:text-purple-400";
      case "FAILED":
      case "REJECTED":
        return "bg-red-100 text-red-700 ring-red-600/20 dark:bg-red-900/20 dark:text-red-400";
      case "CANCELLED":
        return "bg-gray-100 text-gray-700 ring-gray-600/20 dark:bg-gray-900/20 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-700 ring-gray-600/20 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "Success";
      case "PENDING":
        return "Pending";
      case "PROCESSING":
        return "Processing";
      case "APPROVED":
        return "Approved";
      case "FAILED":
        return "Failed";
      case "REJECTED":
        return "Rejected";
      case "CANCELLED":
        return "Cancelled";
      default:
        return status;
    }
  };

  const getAmountPrefix = (type: string) => {
    return type === "DEPOSIT" || type === "REWARD" ? "+" : "-";
  };

  const getAmountColor = (type: string) => {
    return type === "DEPOSIT" || type === "REWARD" ? "text-green-600" : "text-red-600";
  };

  // Group transactions by date
  const groupTransactionsByDate = (transactions: Transaction[]) => {
    const groups: { [date: string]: Transaction[] } = {};

    transactions.forEach((transaction) => {
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
        dateLabel = date.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
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

  // Calculate profit and generate chart data
  const calculateProfit = () => {
    if (!stats) return 0;
    return (stats.totalDeposits + stats.totalRewards) - stats.totalWithdrawals;
  };

  const generateChartData = () => {
    // Generate sample data for the chart - replace with actual transaction data
    const days = ["1", "2", "3", "4", "5", "6", "7"];
    const baseValue = stats?.totalDeposits || 1000;
    return days.map((day, index) => ({
      x: day,
      v: baseValue + (Math.random() - 0.5) * 200 + index * 50
    }));
  };

  const profit = calculateProfit();
  const chartData = generateChartData();

  // Show loading state while checking authentication
  if (loading || !mounted) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-16 h-16">
              <Image
                src="/logo.png"
                alt="Mintward Logo"
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
          {/* This Month Summary with Chart */}
          <Card
            className="relative overflow-hidden rounded-lg border bg-card text-card-foreground p-5"
          >
            {/* Title and metrics */}
            <div className="space-y-1">
              <h1 className="text-pretty text-2xl font-semibold">This Month Summary</h1>
              <p className="text-sm text-muted-foreground">
                Deposited <span className="font-medium text-foreground">₹ {stats?.totalDeposits.toLocaleString('en-IN') || '0'}</span>
                {" | "}
                Withdrawn <span className="font-medium text-foreground">₹ {stats?.totalWithdrawals.toLocaleString('en-IN') || '0'}</span>
              </p>
            </div>

  
            {/* Chart */}
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={profit >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0.5} />
                      <stop offset="95%" stopColor={profit >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="x" hide />
                  <Tooltip cursor={{ stroke: "transparent", fill: "transparent" }} content={() => null} />
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={profit >= 0 ? "#10b981" : "#ef4444"}
                    strokeWidth={2.5}
                    fill="url(#areaGreen)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Subtle inner shadow to mimic screenshot depth */}
            <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-black/10" />
          </Card>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
            <span className="text-xs text-muted-foreground sm:order-1">
              {stats?.totalTransactions || 0} transactions
            </span>
            <div className="flex gap-2 sm:order-2">
              <Select
                value={typeFilter}
                onValueChange={(value) => {
                  setTypeFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[120px] h-9">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="DEPOSIT">Deposit</SelectItem>
                  <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
                  <SelectItem value="REWARD">Reward</SelectItem>
                  <SelectItem value="REFUND">Refund</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[120px] h-9">
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
          <div
            className="w-full border-t border-muted-foreground/20 my-4"
            role="separator"
            aria-label="Transaction list"
          ></div>

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
                  <p className="text-xs">
                    Your transaction history will appear here
                  </p>
                </div>
              </div>
            ) : (
              Object.entries(groupedTransactions).map(
                ([dateLabel, dateTransactions]) => (
                  <div key={dateLabel} className="space-y-3">
                    {/* Date Header */}
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        {dateLabel}
                      </h3>
                      <div className="flex-1 h-px bg-muted-foreground/20"></div>
                      <span className="text-xs text-muted-foreground">
                        {dateTransactions.length} transaction
                        {dateTransactions.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Transactions for this date */}
                    <div className="space-y-3">
                      {dateTransactions.map((transaction) => (
                        <Card
                          key={transaction.id}
                          className="bg-card text-card-foreground hover:shadow-md transition-all duration-200 border-border py-3 px-4"
                        >
                          <div className="flex items-center justify-between gap-4">
                              {/* Left side - Icon and Type */}
                              <div className="flex items-center gap-1">
                                {getTypeIcon(transaction.type)}
                                <span className="text-xs text-muted-foreground">
                                  {getTypeLabel(transaction.type)}
                                </span>
                              </div>

                              {/* Center - Amount */}
                              <div className="flex-1 text-center">
                                <p
                                  className={`text-lg font-bold ${
                                    transaction.type === "DEPOSIT" ||
                                    transaction.type === "REWARD"
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {formatAmount(
                                    transaction.amount,
                                    transaction.type
                                  )}
                                </p>
                                {transaction.metadata?.isWithdrawalRequest &&
                                  transaction.metadata.rejectionReason && (
                                    <p className="text-xs text-red-600 mt-1 truncate">
                                      {transaction.metadata.rejectionReason}
                                    </p>
                                  )}
                              </div>

                              {/* Right side - Status, Time, and Details button */}
                              <div className="flex items-center justify-end gap-2">
                                <div className="flex flex-col items-end gap-1">
                                  {getStatusBadge(transaction.status)}
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(
                                      transaction.createdAt
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 hover:bg-muted-foreground/10 sm:hidden"
                                      onClick={() => {
                                        setSelectedTransaction(transaction);
                                        setIsSheetOpen(true);
                                      }}
                                    >
                                      <FiEye className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 hover:bg-muted-foreground/10 hidden sm:flex"
                                      onClick={() => {
                                        setSelectedTransaction(transaction);
                                        setIsSheetOpen(true);
                                      }}
                                    >
                                      <FiEye className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )
              )
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-muted-foreground/20">
              <div className="text-center sm:text-left">
                <p className="text-xs text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  of {pagination.total} transactions
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

          {/* React Modal Sheet */}
          {selectedTransaction && (
            <>
              <style jsx global>{`
                .react-modal-sheet-container {
                  background-color: var(--background) !important;
                  border-top: 1px solid var(--border) !important;
                }
                .dark .react-modal-sheet-container {
                  background-color: var(--background) !important;
                }
              `}</style>
              <Sheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                snapPoints={[0, 0.85, 1]}
                initialSnap={1}
                disableDrag={false}
              >
                <Sheet.Container className="bg-background border-t border-border shadow-2xl rounded-t-2xl mx-2 mt-2 mr-4">
                  <Sheet.Header>
                    <div className="flex items-center justify-between mb-4 px-4">
                      <div className="flex-1" />
                      <div className="mx-auto w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
                      <div className="flex-1 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsSheetOpen(false)}
                          className="h-8 w-8 p-0 rounded-full bg-background border border-border hover:bg-muted-foreground/10 transition-colors shadow-sm mt-3"
                        >
                          <FiX className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Sheet.Header>
                  <Sheet.Content className="h-full overflow-y-auto pb-6">
                    <div className="p-6 h-full overflow-y-auto">
                    {/* Sheet Header */}
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold">Transaction Details</h2>
                      <p className="text-sm text-muted-foreground">
                        Full transaction information and details.
                      </p>
                    </div>

                    <div className="space-y-6">
                      {/* Status and Date Section */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Status & Date</h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(
                                selectedTransaction.status
                              )}`}
                            >
                              {getStatusLabel(selectedTransaction.status)}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {new Date(selectedTransaction.createdAt).toLocaleDateString()}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(selectedTransaction.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Amount Section */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Amount</h3>
                        <div className="rounded-lg border p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Amount</span>
                            <span
                              className={`text-lg font-semibold ${getAmountColor(
                                selectedTransaction.type
                              )}`}
                            >
                              {getAmountPrefix(selectedTransaction.type)}
                              {selectedTransaction.amount.toLocaleString("en-IN", {
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Transaction ID Section */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Transaction Details</h3>
                        <div className="rounded-lg border p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Type</span>
                            <div className="flex items-center gap-1">
                              {getTypeIcon(selectedTransaction.type)}
                              <span className="text-xs font-medium">
                                {getTypeLabel(selectedTransaction.type)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Transaction ID</span>
                            <span className="text-xs font-mono">
                              #{selectedTransaction.id}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Description Section */}
                      {selectedTransaction.description && (
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium">Description</h3>
                          <div className="rounded-lg border p-4">
                            <p className="text-sm text-muted-foreground">
                              {selectedTransaction.description}
                            </p>
                          </div>
                        </div>
                      )}

    
                      {/* Withdrawal Request Details */}
                      {selectedTransaction.metadata?.isWithdrawalRequest && (
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium">Withdrawal Details</h3>
                          <div className="rounded-lg border p-4 space-y-3">
                            {selectedTransaction.metadata.withdrawalMethodType && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Method Type</span>
                                <span className="text-sm font-medium capitalize">
                                  {selectedTransaction.metadata.withdrawalMethodType
                                    .replace("_", " ")
                                    .toLowerCase()}
                                </span>
                              </div>
                            )}
                            {selectedTransaction.metadata.processedAt && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Processed On</span>
                                <span className="text-sm font-medium">
                                  {new Date(selectedTransaction.metadata.processedAt).toLocaleDateString()} at{" "}
                                  {new Date(selectedTransaction.metadata.processedAt).toLocaleTimeString()}
                                </span>
                              </div>
                            )}
                            {selectedTransaction.metadata.rejectionReason && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-muted-foreground">Rejection Reason</span>
                                </div>
                                <div className="bg-red-50 p-2 rounded border border-red-200">
                                  <p className="text-sm text-red-600">
                                    {selectedTransaction.metadata.rejectionReason}
                                  </p>
                                </div>
                              </div>
                            )}
                            {selectedTransaction.metadata.adminNotes && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-muted-foreground">Admin Notes</span>
                                </div>
                                <div className="bg-blue-50 p-2 rounded border border-blue-200">
                                  <p className="text-sm">
                                    {selectedTransaction.metadata.adminNotes}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      </div>
                  </div>
                </Sheet.Content>
              </Sheet.Container>
              <Sheet.Backdrop onTap={() => setIsSheetOpen(false)} />
            </Sheet>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
