"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FaArrowUp, FaArrowDown, FaChartLine, FaDollarSign, FaPercent, FaCreditCard, FaWallet, FaExclamationTriangle, FaSpinner, FaArrowRight } from "react-icons/fa";
import { Spinner } from "@/components/ui/spinner";

export default function TradePage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [selectedCrypto, setSelectedCrypto] = useState("BTC");
  const [walletData, setWalletData] = useState<{
    balance: number;
    currency: string;
    recentTransactions: any[];
    paymentStats: any;
  } | null>(null);
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);
  const [isProcessingTrade, setIsProcessingTrade] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) {
      router.push("/signin");
    }
  }, [session, loading, router]);

  // Fetch wallet data
  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const response = await fetch("/api/wallet");
        if (response.ok) {
          const data = await response.json();
          setWalletData(data);
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

  const handleTrade = async () => {
    if (!amount || !selectedCrypto) {
      setTradeError("Please enter amount and select cryptocurrency");
      return;
    }

    const tradeAmount = parseFloat(amount);
    if (tradeAmount <= 0) {
      setTradeError("Please enter a valid amount");
      return;
    }

    if (tradeType === "buy" && tradeAmount > (walletData?.balance || 0)) {
      setTradeError("Insufficient balance for this trade");
      return;
    }

    setIsProcessingTrade(true);
    setTradeError(null);

    try {
      // Here you would implement the actual trading logic
      // For now, we'll simulate a trade
      const response = await fetch("/api/trade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: tradeType,
          amount: tradeAmount,
          cryptocurrency: selectedCrypto,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Refresh wallet data
        const walletResponse = await fetch("/api/wallet");
        if (walletResponse.ok) {
          const walletData = await walletResponse.json();
          setWalletData(walletData);
        }
        setAmount("");
        // Show success message (you could add a toast notification here)
      } else {
        setTradeError(data.error || "Trade failed");
      }
    } catch (error) {
      setTradeError("Network error occurred");
    } finally {
      setIsProcessingTrade(false);
    }
  };

  if (loading) {
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

  if (!session) {
    return null;
  }

  const cryptoOptions = [
    { symbol: "BTC", name: "Bitcoin", price: 45231.89, change: 5.8 },
    { symbol: "ETH", name: "Ethereum", price: 3124.56, change: -1.4 },
    { symbol: "BNB", name: "Binance Coin", price: 412.34, change: 3.1 },
    { symbol: "SOL", name: "Solana", price: 98.76, change: 6.1 },
  ];

  const selectedCryptoData = cryptoOptions.find(c => c.symbol === selectedCrypto);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      <Card className="flex-1 w-full rounded-none shadow-none border-0 bg-background sm:rounded-lg sm:shadow-lg sm:border sm:max-w-2xl mx-auto my-8 overflow-y-auto">
        <CardContent className="px-6 space-y-6">
          {/* Wallet Balance */}
          <Card className="bg-muted/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <FaWallet className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Available Balance</h3>
                    <p className="text-sm text-muted-foreground">For trading</p>
                  </div>
                </div>
                <div className="text-right">
                  {isLoadingWallet ? (
                    <div className="flex items-center space-x-2">
                      <FaSpinner className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Loading...</span>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">
                        ₹{walletData?.balance?.toLocaleString() || "0.00"}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push("/wallet")}
                        className="mt-1"
                      >
                        <FaCreditCard className="h-4 w-4 mr-1" />
                        Add Funds
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trading Panel */}
            <div className="lg:col-span-2">
              <Card className="bg-muted/30">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-2">Quick Trade</h3>
                  <p className="text-sm text-muted-foreground mb-4">Execute trades in real-time</p>
                  <Tabs defaultValue="buy" onValueChange={(value) => setTradeType(value as "buy" | "sell")}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="buy">Buy</TabsTrigger>
                      <TabsTrigger value="sell">Sell</TabsTrigger>
                    </TabsList>

                    <TabsContent value="buy">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="crypto-select">Select Cryptocurrency</Label>
                        <div className="relative group">
                          <FaDollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 size-5 pointer-events-none" />
                          <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                            <SelectTrigger className="h-12 pl-12 bg-muted/30 rounded-lg border border-muted-foreground/20">
                              <SelectValue placeholder="Choose cryptocurrency" />
                            </SelectTrigger>
                          <SelectContent>
                            {cryptoOptions.map((crypto) => (
                              <SelectItem key={crypto.symbol} value={crypto.symbol}>
                                <div className="flex items-center justify-between w-full">
                                  <span className="font-medium">{crypto.name}</span>
                                  <Badge
                                    variant={crypto.change >= 0 ? "default" : "destructive"}
                                    className="text-xs h-5 px-1.5 ml-2"
                                  >
                                    {crypto.change >= 0 ? '+' : ''}{crypto.change}%
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount (USD)</Label>
                        <div className="relative group">
                          <FaDollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 size-5 pointer-events-none" />
                          <Input
                            id="amount"
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="pl-12 h-12 bg-muted/30 rounded-lg border border-muted-foreground/20"
                          />
                        </div>
                      </div>

                      {selectedCryptoData && amount && (
                        <Card className="bg-muted/30">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Estimated {selectedCryptoData.symbol}</span>
                              <span className="font-medium">
                                {(parseFloat(amount) / selectedCryptoData.price).toFixed(6)} {selectedCryptoData.symbol}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {tradeError && (
                        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg flex items-center gap-2">
                          <FaExclamationTriangle className="h-4 w-4" />
                          {tradeError}
                        </div>
                      )}

                      {tradeType === "buy" && amount && parseFloat(amount) > (walletData?.balance || 0) && (
                        <div className="p-3 text-sm text-amber-600 bg-amber-50 rounded-lg flex items-center gap-2">
                          <FaExclamationTriangle className="h-4 w-4" />
                          Insufficient balance. Please add funds to continue.
                          <Button
                            variant="link"
                            className="text-amber-600 underline p-0 h-auto ml-auto"
                            onClick={() => router.push("/wallet")}
                          >
                            Add Funds
                          </Button>
                        </div>
                      )}

                      <Button
                        className="w-full h-12 text-lg font-semibold bg-green-600 hover:bg-green-700"
                        onClick={handleTrade}
                        disabled={isProcessingTrade || !!(tradeType === "buy" && amount && parseFloat(amount) > (walletData?.balance || 0))}
                      >
                        {isProcessingTrade ? (
                          <>
                            <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          `Buy ${selectedCrypto}`
                        )}
                      </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="sell">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="crypto-select-sell">Select Cryptocurrency</Label>
                        <div className="relative group">
                          <FaDollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 size-5 pointer-events-none" />
                          <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                            <SelectTrigger className="h-12 pl-12 bg-muted/30 rounded-lg border border-muted-foreground/20">
                              <SelectValue placeholder="Choose cryptocurrency" />
                            </SelectTrigger>
                          <SelectContent>
                            {cryptoOptions.map((crypto) => (
                              <SelectItem key={crypto.symbol} value={crypto.symbol}>
                                <div className="flex items-center justify-between w-full">
                                  <span className="font-medium">{crypto.name}</span>
                                  <Badge
                                    variant={crypto.change >= 0 ? "default" : "destructive"}
                                    className="text-xs h-5 px-1.5 ml-2"
                                  >
                                    {crypto.change >= 0 ? '+' : ''}{crypto.change}%
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="amount-sell">Amount (USD)</Label>
                        <div className="relative group">
                          <FaDollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 size-5 pointer-events-none" />
                          <Input
                            id="amount-sell"
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="pl-12 h-12 bg-muted/30 rounded-lg border border-muted-foreground/20"
                          />
                        </div>
                      </div>

                      {selectedCryptoData && amount && (
                        <Card className="bg-muted/30">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Estimated {selectedCryptoData.symbol}</span>
                              <span className="font-medium">
                                {(parseFloat(amount) / selectedCryptoData.price).toFixed(6)} {selectedCryptoData.symbol}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {tradeError && (
                        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg flex items-center gap-2">
                          <FaExclamationTriangle className="h-4 w-4" />
                          {tradeError}
                        </div>
                      )}

                      <Button
                        className="w-full h-12 text-lg font-semibold bg-red-600 hover:bg-red-700"
                        onClick={handleTrade}
                        disabled={isProcessingTrade}
                      >
                        {isProcessingTrade ? (
                          <>
                            <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          `Sell ${selectedCrypto}`
                        )}
                      </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Market Info Panel */}
            <div className="space-y-4">
              {/* Current Price */}
              <Card className="bg-muted/30">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-2">Current Price</h3>
                  {selectedCryptoData && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">
                          ${selectedCryptoData.price.toLocaleString()}
                        </span>
                        <Badge variant={selectedCryptoData.change >= 0 ? "default" : "destructive"}>
                          {selectedCryptoData.change >= 0 ? '+' : ''}{selectedCryptoData.change}%
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {selectedCryptoData.name} ({selectedCryptoData.symbol})
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Market Stats */}
              <Card className="bg-muted/30">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Market Statistics</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FaChartLine className="h-4 w-4 text-green-600" />
                        <span className="text-sm">24h High</span>
                      </div>
                      <span className="font-medium text-sm">$46,234.50</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FaArrowDown className="h-4 w-4 text-red-600" />
                        <span className="text-sm">24h Low</span>
                      </div>
                      <span className="font-medium text-sm">$44,123.80</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FaDollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Volume (24h)</span>
                      </div>
                      <span className="font-medium text-sm">$28.5B</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FaPercent className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Volatility</span>
                      </div>
                      <span className="font-medium text-sm">5.2%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-muted/30">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start h-12"
                      onClick={() => router.push("/wallet")}
                    >
                      <FaCreditCard className="h-4 w-4 mr-2" />
                      Add Funds
                    </Button>
                    <Button variant="outline" className="w-full justify-start h-12">
                      <FaArrowRight className="h-4 w-4 mr-2" />
                      Limit Order
                    </Button>
                    <Button variant="outline" className="w-full justify-start h-12">
                      <FaArrowDown className="h-4 w-4 mr-2" />
                      Stop Loss
                    </Button>
                    <Button variant="outline" className="w-full justify-start h-12">
                      <FaChartLine className="h-4 w-4 mr-2" />
                      Take Profit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 px-6 pb-8">
          <div className="relative w-full my-4" role="separator" aria-label="Trading actions">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted-foreground/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-3 text-muted-foreground">Trading Actions</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-12 p-0 flex-col items-center justify-center text-xs"
            >
              <FaArrowRight className="h-4 w-4 mb-1" />
              Orders
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-12 p-0 flex-col items-center justify-center text-xs"
            >
              <FaChartLine className="h-4 w-4 mb-1" />
              Analytics
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-12 p-0 flex-col items-center justify-center text-xs"
            >
              <FaDollarSign className="h-4 w-4 mb-1" />
              Portfolio
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
