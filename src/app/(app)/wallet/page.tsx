"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpRight, ArrowDownRight, CreditCard, Smartphone, Building, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

export default function WalletPage() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.push("/signin");
    }
  }, [session, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
            <CreditCard className="absolute inset-0 m-auto text-primary size-6" />
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const [activeTab, setActiveTab] = useState("deposit");
  const [depositAmount, setDepositAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawalMethod, setWithdrawalMethod] = useState("");
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [selectedUpiMethod, setSelectedUpiMethod] = useState("");
  const [withdrawalDetails, setWithdrawalDetails] = useState({
    name: "",
    upiId: "",
    bankAccount: "",
    phone: "",
    email: ""
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [walletData, setWalletData] = useState<{
    balance: number;
    currency: string;
    recentTransactions: any[];
    paymentStats: any;
  } | null>(null);
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);

  const upiMethods = [
    { id: "kukupay", name: "KukuPay UPI", icon: Smartphone, color: "bg-green-500" },
    { id: "gpay", name: "Google Pay", icon: Smartphone, color: "bg-blue-500" },
    { id: "paytm", name: "Paytm", icon: Smartphone, color: "bg-cyan-500" },
    { id: "phonepe", name: "PhonePe", icon: Smartphone, color: "bg-purple-500" }
  ];

  const withdrawalMethods = [
    { id: "upi", name: "UPI Transfer", icon: Smartphone },
    { id: "bank", name: "Bank Transfer", icon: Building }
  ];

  // Fetch wallet data
  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const response = await fetch("/api/wallet");
        if (response.ok) {
          const data = await response.json();
          // Transform the API response to match expected format
          setWalletData({
            balance: data.wallet?.balance || 0,
            currency: data.wallet?.currency || "INR",
            recentTransactions: data.recentTransactions || [],
            paymentStats: data.paymentStats || {},
          });
        }
      } catch (error) {
        console.error("Failed to fetch wallet data:", error);
      } finally {
        setIsLoadingWallet(false);
      }
    };

    if (session) {
      fetchWalletData();
    }
  }, [session]);

  const handleDeposit = async () => {
    if (!depositAmount) {
      setTransactionStatus("error");
      setError("Please enter a deposit amount");
      return;
    }

    const amount = parseFloat(depositAmount);
    if (amount < 300 || amount > 100000) {
      setTransactionStatus("error");
      setError("Deposit amount must be between ₹300 and ₹1,00,000");
      return;
    }

    setIsProcessing(true);
    setTransactionStatus("processing");
    setError(null);

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount,
          phone: phone || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTransactionStatus("success");
        setDepositAmount("");
        setPhone("");
        setSelectedUpiMethod("");

        // Redirect to payment URL
        if (data.payment?.paymentUrl) {
          window.location.href = data.payment.paymentUrl;
        }
      } else {
        setTransactionStatus("error");
        setError(data.error || "Payment initiation failed");
      }
    } catch (error) {
      setTransactionStatus("error");
      setError("Network error occurred");
    } finally {
      setIsProcessing(false);

      // Reset status after 5 seconds
      setTimeout(() => setTransactionStatus("idle"), 5000);
    }
  };

  const handleWithdrawalDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const response = await fetch("/api/withdrawal-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: withdrawalDetails.name,
          upiId: withdrawalDetails.upiId,
          bankAccount: withdrawalDetails.bankAccount,
          phone: withdrawalDetails.phone,
          email: withdrawalDetails.email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Successfully saved withdrawal details
        setShowWithdrawalForm(false);
        setTransactionStatus("success");
      } else {
        setTransactionStatus("error");
        setError(data.error || "Failed to save withdrawal details");
      }
    } catch (error) {
      setTransactionStatus("error");
      setError("Network error occurred while saving details");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || !withdrawalMethod) {
      setTransactionStatus("error");
      setError("Please enter withdrawal amount and select method");
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (amount < 100) {
      setTransactionStatus("error");
      setError("Minimum withdrawal amount is ₹100");
      return;
    }

    if (amount > (walletData?.balance || 0)) {
      setTransactionStatus("error");
      setError("Insufficient balance");
      return;
    }

    setIsProcessing(true);
    setTransactionStatus("processing");
    setError(null);

    try {
      const response = await fetch("/api/withdrawal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount,
          withdrawalMethod: withdrawalMethod,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTransactionStatus("success");
        setWithdrawAmount("");
        setWithdrawalMethod("");
        // Refresh wallet data
        const walletResponse = await fetch("/api/wallet");
        if (walletResponse.ok) {
          const walletResponseData = await walletResponse.json();
          setWalletData({
            balance: walletResponseData.wallet?.balance || 0,
            currency: walletResponseData.wallet?.currency || "INR",
            recentTransactions: walletResponseData.recentTransactions || [],
            paymentStats: walletResponseData.paymentStats || {},
          });
        }
      } else {
        setTransactionStatus("error");
        setError(data.error || "Withdrawal failed");
      }
    } catch (error) {
      setTransactionStatus("error");
      setError("Network error occurred");
    } finally {
      setIsProcessing(false);

      // Reset status after 3 seconds
      setTimeout(() => setTransactionStatus("idle"), 3000);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      <Card className="flex-1 w-full rounded-none shadow-none border-0 bg-background sm:rounded-lg sm:shadow-lg sm:border sm:max-w-2xl mx-auto my-8 overflow-y-auto">
        <CardContent className="px-6 space-y-6">
          {/* Balance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-muted/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingWallet ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {walletData ? `₹${walletData.balance.toLocaleString()}` : "₹0.00"}
                    </div>
                    <p className="text-xs text-muted-foreground">Available for trading</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Deposits</CardTitle>
                <ArrowDownRight className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                {isLoadingWallet ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      ₹{(walletData?.paymentStats?.PENDING?.totalAmount || 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {walletData?.paymentStats?.PENDING?.count || 0} transactions
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Deposits</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                {isLoadingWallet ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      ₹{(walletData?.paymentStats?.COMPLETED?.totalAmount || 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {walletData?.paymentStats?.COMPLETED?.count || 0} transactions
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Deposit/Withdrawal Tabs */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-xl">Wallet Management</CardTitle>
              <CardDescription>Deposit funds or withdraw money from your account</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="deposit" className="flex items-center gap-2">
                    <ArrowDownRight className="h-4 w-4" />
                    Deposit
                  </TabsTrigger>
                  <TabsTrigger value="withdrawal" className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4" />
                    Withdrawal
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="deposit" className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="deposit-amount">Deposit Amount (₹)</Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground">₹</span>
                        <Input
                          id="deposit-amount"
                          type="number"
                          placeholder="0.00"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          className="pl-12 h-12 bg-muted/30 rounded-lg border border-muted-foreground/20 text-lg"
                          min="300"
                          max="100000"
                          step="1"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Minimum: ₹300, Maximum: ₹1,00,000
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number (Optional)</Label>
                      <div className="relative">
                        <Smartphone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 size-5 pointer-events-none" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="pl-12 h-12 bg-muted/30 rounded-lg border border-muted-foreground/20"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        For payment notifications and verification
                      </p>
                    </div>

                    {error && (
                      <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                      </div>
                    )}

                    {transactionStatus === "processing" && (
                      <div className="p-3 text-sm text-blue-600 bg-blue-50 rounded-lg flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing your deposit...
                      </div>
                    )}

                    {transactionStatus === "success" && (
                      <div className="p-3 text-sm text-green-600 bg-green-50 rounded-lg flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Redirecting to payment gateway...
                      </div>
                    )}

                    <Button
                      onClick={handleDeposit}
                      className="w-full h-12 text-lg font-semibold bg-green-600 hover:bg-green-700"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Deposit Funds"
                      )}
                    </Button>
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Quick Amount</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {[500, 1000, 5000, 10000].map((amount) => (
                        <Button
                          key={amount}
                          variant="outline"
                          onClick={() => setDepositAmount(amount.toString())}
                          className="h-10"
                        >
                          ₹{amount}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Method Info */}
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <Smartphone className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium">KukuPay Payment</h4>
                        <p className="text-sm text-muted-foreground">Secure UPI payment gateway</p>
                      </div>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1 mt-3">
                      <li>• Instant deposit processing</li>
                      <li>• Secure payment gateway</li>
                      <li>• Multiple UPI apps supported</li>
                      <li>• Auto-refund on failure</li>
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="withdrawal" className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="withdraw-amount">Withdrawal Amount (INR)</Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground">₹</span>
                        <Input
                          id="withdraw-amount"
                          type="number"
                          placeholder="0.00"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          className="pl-12 h-12 bg-muted/30 rounded-lg border border-muted-foreground/20 text-lg"
                          min="100"
                          max={walletData?.balance}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Minimum withdrawal: ₹100 | Available: ₹{walletData?.balance?.toFixed(2) || "0.00"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="withdrawal-method">Withdrawal Method</Label>
                      <Select value={withdrawalMethod} onValueChange={setWithdrawalMethod}>
                        <SelectTrigger className="h-12 bg-muted/30 rounded-lg border border-muted-foreground/20">
                          <SelectValue placeholder="Choose withdrawal method" />
                        </SelectTrigger>
                        <SelectContent>
                          {withdrawalMethods.map((method) => (
                            <SelectItem key={method.id} value={method.id}>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <method.icon className="h-4 w-4 text-primary" />
                                </div>
                                <span className="font-medium">{method.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWithdrawAmount("500")}
                      >
                        ₹500
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWithdrawAmount("1000")}
                      >
                        ₹1,000
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWithdrawAmount(walletData?.balance?.toString() || "0")}
                      >
                        Max
                      </Button>
                    </div>

                    {error && (
                      <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                      </div>
                    )}

                    {transactionStatus === "processing" && (
                      <div className="p-3 text-sm text-blue-600 bg-blue-50 rounded-lg flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing your withdrawal...
                      </div>
                    )}

                    {transactionStatus === "success" && (
                      <div className="p-3 text-sm text-green-600 bg-green-50 rounded-lg flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Withdrawal initiated successfully! You will receive funds within 24-48 hours.
                      </div>
                    )}

                    <Button
                      onClick={handleWithdraw}
                      className="w-full h-12 text-lg font-semibold bg-red-600 hover:bg-red-700"
                      disabled={!withdrawAmount || !withdrawalMethod || isProcessing || parseFloat(withdrawAmount) < 100 || parseFloat(withdrawAmount) > (walletData?.balance || 0)}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Withdraw Funds"
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
