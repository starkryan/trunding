"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpRight, ArrowDownRight, CreditCard, Smartphone, Building, AlertCircle, CheckCircle } from "lucide-react";

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const [activeTab, setActiveTab] = useState("deposit");
  const [depositAmount, setDepositAmount] = useState("");
  const [selectedUpiMethod, setSelectedUpiMethod] = useState("");
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalMethod, setWithdrawalMethod] = useState("");
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
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

  const handleDeposit = async () => {
    if (!depositAmount || !selectedUpiMethod) {
      setTransactionStatus("error");
      return;
    }

    setIsProcessing(true);
    setTransactionStatus("processing");

    try {
      const response = await fetch("/api/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: depositAmount,
          upiMethod: selectedUpiMethod,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTransactionStatus("success");
        setDepositAmount("");
        setSelectedUpiMethod("");
        
        // In a real implementation, redirect to payment URL
        if (data.paymentUrl) {
          window.open(data.paymentUrl, "_blank");
        }
      } else {
        setTransactionStatus("error");
        setError(data.error || "Deposit failed");
      }
    } catch (error) {
      setTransactionStatus("error");
      setError("Network error occurred");
    } finally {
      setIsProcessing(false);
      
      // Reset status after 3 seconds
      if (transactionStatus === "success") {
        setTimeout(() => setTransactionStatus("idle"), 3000);
      }
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

  const handleWithdrawal = async () => {
    if (!withdrawalAmount || !withdrawalMethod) {
      setTransactionStatus("error");
      return;
    }

    setIsProcessing(true);
    setTransactionStatus("processing");

    try {
      const response = await fetch("/api/withdrawal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: withdrawalAmount,
          withdrawalMethod: withdrawalMethod,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTransactionStatus("success");
        setWithdrawalAmount("");
        setWithdrawalMethod("");
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
      if (transactionStatus === "success") {
        setTimeout(() => setTransactionStatus("idle"), 3000);
      }
    }
  };

  return (
    <div className="h-screen w-full bg-background flex flex-col">
      {/* Main content area with padding for mobile tabs */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-6">
          {/* Balance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$12,234.50</div>
                <p className="text-xs text-muted-foreground">Available for trading</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Deposits</CardTitle>
                <ArrowDownRight className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$500.00</div>
                <p className="text-xs text-muted-foreground">2 transactions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$250.00</div>
                <p className="text-xs text-muted-foreground">1 transaction</p>
              </CardContent>
            </Card>
          </div>

          {/* Deposit/Withdrawal Tabs */}
          <Card>
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
                      <Label htmlFor="deposit-amount">Deposit Amount (USD)</Label>
                      <Input
                        id="deposit-amount"
                        type="number"
                        placeholder="0.00"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="h-12 text-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="upi-method">Select UPI Payment Method</Label>
                      <Select value={selectedUpiMethod} onValueChange={setSelectedUpiMethod}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Choose UPI method" />
                        </SelectTrigger>
                        <SelectContent>
                          {upiMethods.map((method) => (
                            <SelectItem key={method.id} value={method.id}>
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full ${method.color} flex items-center justify-center`}>
                                  <method.icon className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <span className="font-medium">{method.name}</span>
                                  <p className="text-xs text-muted-foreground">Instant transfer</p>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {transactionStatus === "error" && (
                      <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Please fill in all required fields
                      </div>
                    )}

                    {transactionStatus === "processing" && (
                      <div className="p-3 text-sm text-blue-600 bg-blue-50 rounded-lg flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        Processing your deposit...
                      </div>
                    )}

                    {transactionStatus === "success" && (
                      <div className="p-3 text-sm text-green-600 bg-green-50 rounded-lg flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Deposit initiated successfully! You will receive funds shortly.
                      </div>
                    )}

                    <Button 
                      onClick={handleDeposit} 
                      className="w-full h-12 text-lg font-semibold bg-green-600 hover:bg-green-700"
                      disabled={isProcessing}
                    >
                      {isProcessing ? "Processing..." : "Deposit Funds"}
                    </Button>
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Quick Amount</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {[50, 100, 500, 1000].map((amount) => (
                        <Button
                          key={amount}
                          variant="outline"
                          onClick={() => setDepositAmount(amount.toString())}
                          className="h-10"
                        >
                          ${amount}
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="withdrawal" className="space-y-6">
                  {!showWithdrawalForm ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="withdrawal-amount">Withdrawal Amount (USD)</Label>
                        <Input
                          id="withdrawal-amount"
                          type="number"
                          placeholder="0.00"
                          value={withdrawalAmount}
                          onChange={(e) => setWithdrawalAmount(e.target.value)}
                          className="h-12 text-lg"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="withdrawal-method">Withdrawal Method</Label>
                        <Select value={withdrawalMethod} onValueChange={setWithdrawalMethod}>
                          <SelectTrigger className="h-12">
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

                      {transactionStatus === "error" && (
                        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Please fill in all required fields
                        </div>
                      )}

                      <Button 
                        onClick={() => setShowWithdrawalForm(true)}
                        className="w-full h-12 text-lg font-semibold bg-red-600 hover:bg-red-700"
                      >
                        Continue to Withdrawal Details
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <h3 className="font-medium mb-2">Withdrawal Details</h3>
                        <p className="text-sm text-muted-foreground">
                          Please provide your withdrawal details. This information will be saved securely for future withdrawals.
                        </p>
                      </div>

                      <form onSubmit={handleWithdrawalDetailsSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="full-name">Full Name</Label>
                            <Input
                              id="full-name"
                              placeholder="John Doe"
                              value={withdrawalDetails.name}
                              onChange={(e) => setWithdrawalDetails({...withdrawalDetails, name: e.target.value})}
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="upi-id">UPI ID</Label>
                            <Input
                              id="upi-id"
                              placeholder="john@upi"
                              value={withdrawalDetails.upiId}
                              onChange={(e) => setWithdrawalDetails({...withdrawalDetails, upiId: e.target.value})}
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="bank-account">Bank Account Number</Label>
                            <Input
                              id="bank-account"
                              placeholder="1234567890"
                              value={withdrawalDetails.bankAccount}
                              onChange={(e) => setWithdrawalDetails({...withdrawalDetails, bankAccount: e.target.value})}
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              placeholder="+1 (555) 123-4567"
                              value={withdrawalDetails.phone}
                              onChange={(e) => setWithdrawalDetails({...withdrawalDetails, phone: e.target.value})}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="john@example.com"
                            value={withdrawalDetails.email}
                            onChange={(e) => setWithdrawalDetails({...withdrawalDetails, email: e.target.value})}
                            required
                          />
                        </div>

                        <div className="flex gap-3">
                          <Button type="submit" className="flex-1">
                            Save Details
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setShowWithdrawalForm(false)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>

                      {transactionStatus === "processing" && (
                        <div className="p-3 text-sm text-blue-600 bg-blue-50 rounded-lg flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
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
                        onClick={handleWithdrawal} 
                        className="w-full h-12 text-lg font-semibold bg-red-600 hover:bg-red-700"
                        disabled={isProcessing}
                      >
                        {isProcessing ? "Processing..." : `Withdraw $${withdrawalAmount || "0.00"}`}
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
