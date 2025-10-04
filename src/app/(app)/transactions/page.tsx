"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";
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

      const response = await fetch(`/api/transactions?${params}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }

      const data = await response.json();
      setTransactions(data.transactions);
      setStats(data.stats);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="default" className="text-xs">Completed</Badge>;
      case "PENDING":
        return <Badge variant="secondary" className="text-xs">Pending</Badge>;
      case "FAILED":
        return <Badge variant="destructive" className="text-xs">Failed</Badge>;
      case "CANCELLED":
        return <Badge variant="outline" className="text-xs">Cancelled</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "DEPOSIT":
        return <FiTrendingUp className="h-4 w-4" />;
      case "WITHDRAWAL":
        return <FiTrendingDown className="h-4 w-4" />;
      case "TRADE_BUY":
        return <FiTrendingUp className="h-4 w-4" />;
      case "TRADE_SELL":
        return <FiTrendingDown className="h-4 w-4" />;
      case "REWARD":
        return <FiGift className="h-4 w-4" />;
      case "REFUND":
        return <FiCreditCard className="h-4 w-4" />;
      default:
        return <FiCreditCard className="h-4 w-4" />;
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

  // Show loading state while checking authentication
  if (loading || !mounted) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
            <FiActivity className="absolute inset-0 m-auto text-primary size-6" />
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
          <div className="flex-1 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
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
              transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-muted-foreground/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-background">
                      {getTypeIcon(transaction.type)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {transaction.description || getTypeLabel(transaction.type)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString()} • {new Date(transaction.createdAt).toLocaleTimeString()}
                      </p>
                      {transaction.referenceId && (
                        <p className="text-xs text-muted-foreground">
                          Ref: {transaction.referenceId}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatAmount(transaction.amount, transaction.type)}
                      </p>
                      <div className="mt-1">{getStatusBadge(transaction.status)}</div>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-muted-foreground/20">
              <p className="text-xs text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} transactions
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="h-8 px-3 text-xs"
                >
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="h-8 px-3 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
