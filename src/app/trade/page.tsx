"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";

export default function TradePage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [selectedCrypto, setSelectedCrypto] = useState("BTC");

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

  const cryptoOptions = [
    { symbol: "BTC", name: "Bitcoin", price: 45231.89, change: 5.8 },
    { symbol: "ETH", name: "Ethereum", price: 3124.56, change: -1.4 },
    { symbol: "BNB", name: "Binance Coin", price: 412.34, change: 3.1 },
    { symbol: "SOL", name: "Solana", price: 98.76, change: 6.1 },
  ];

  const selectedCryptoData = cryptoOptions.find(c => c.symbol === selectedCrypto);

  return (
    <div className="h-screen w-full bg-background flex flex-col">
      {/* Main content area with padding for mobile tabs */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Trade</h1>
            <p className="text-muted-foreground mt-2">Buy and sell cryptocurrencies instantly</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trading Panel */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Trade</CardTitle>
                  <CardDescription>Execute trades in real-time</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="buy" onValueChange={(value) => setTradeType(value as "buy" | "sell")}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="buy">Buy</TabsTrigger>
                      <TabsTrigger value="sell">Sell</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="buy" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="crypto-select">Select Cryptocurrency</Label>
                        <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                          <SelectTrigger>
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

                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount (USD)</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                        />
                      </div>

                      {selectedCryptoData && amount && (
                        <Card className="bg-muted/50">
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

                      <Button className="w-full h-12 text-lg font-semibold bg-green-600 hover:bg-green-700">
                        Buy {selectedCrypto}
                      </Button>
                    </TabsContent>

                    <TabsContent value="sell" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="crypto-select-sell">Select Cryptocurrency</Label>
                        <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                          <SelectTrigger>
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

                      <div className="space-y-2">
                        <Label htmlFor="amount-sell">Amount (USD)</Label>
                        <Input
                          id="amount-sell"
                          type="number"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                        />
                      </div>

                      {selectedCryptoData && amount && (
                        <Card className="bg-muted/50">
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

                      <Button className="w-full h-12 text-lg font-semibold bg-red-600 hover:bg-red-700">
                        Sell {selectedCrypto}
                      </Button>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Market Info Panel */}
            <div className="space-y-6">
              {/* Current Price */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Current Price</CardTitle>
                </CardHeader>
                <CardContent>
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Market Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm">24h High</span>
                    </div>
                    <span className="font-medium text-sm">$46,234.50</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <span className="text-sm">24h Low</span>
                    </div>
                    <span className="font-medium text-sm">$44,123.80</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Volume (24h)</span>
                    </div>
                    <span className="font-medium text-sm">$28.5B</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Percent className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Volatility</span>
                    </div>
                    <span className="font-medium text-sm">5.2%</span>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Limit Order
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <ArrowDownRight className="h-4 w-4 mr-2" />
                    Stop Loss
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Take Profit
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
