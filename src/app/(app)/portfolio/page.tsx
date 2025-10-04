"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  MoreHorizontal
} from "lucide-react";

export default function PortfolioPage() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.push("/signin");
    }
  }, [session, loading, router]);

  if (loading) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <Spinner variant="bars" size={64} className="text-primary mx-auto" />
            <PieChart className="absolute inset-0 m-auto text-primary size-6" />
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const portfolioData = [
    {
      symbol: "BTC",
      name: "Bitcoin",
      amount: 0.5,
      avgPrice: 42000,
      currentPrice: 45231.89,
      change: 5.8,
      value: 22615.95,
      profit: 1615.95,
      profitPercent: 7.7
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      amount: 3.2,
      avgPrice: 2900,
      currentPrice: 3124.56,
      change: -1.4,
      value: 9998.59,
      profit: 718.59,
      profitPercent: 7.8
    },
    {
      symbol: "SOL",
      name: "Solana",
      amount: 25,
      avgPrice: 85,
      currentPrice: 98.76,
      change: 6.1,
      value: 2469.00,
      profit: 344.00,
      profitPercent: 16.2
    },
    {
      symbol: "BNB",
      name: "Binance Coin",
      amount: 5,
      avgPrice: 380,
      currentPrice: 412.34,
      change: 3.1,
      value: 2061.70,
      profit: 161.70,
      profitPercent: 8.5
    }
  ];

  const totalValue = portfolioData.reduce((sum, asset) => sum + asset.value, 0);
  const totalProfit = portfolioData.reduce((sum, asset) => sum + asset.profit, 0);
  const totalProfitPercent = (totalProfit / (totalValue - totalProfit)) * 100;

  const allocationData = [
    { name: "Bitcoin", value: 22615.95, percentage: 60.2, color: "bg-orange-500" },
    { name: "Ethereum", value: 9998.59, percentage: 26.6, color: "bg-blue-500" },
    { name: "Solana", value: 2469.00, percentage: 6.6, color: "bg-purple-500" },
    { name: "Binance Coin", value: 2061.70, percentage: 5.5, color: "bg-yellow-500" },
    { name: "Cash", value: 454.76, percentage: 1.1, color: "bg-green-500" }
  ];

  const recentTransactions = [
    { type: "buy", asset: "BTC", amount: 0.1, price: 44800, date: "2 hours ago", status: "completed" },
    { type: "sell", asset: "ETH", amount: 0.5, price: 3150, date: "5 hours ago", status: "completed" },
    { type: "buy", asset: "SOL", amount: 10, price: 96.50, date: "1 day ago", status: "completed" },
    { type: "transfer", asset: "USDT", amount: 1000, price: 1, date: "2 days ago", status: "completed" }
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      {/* Main content area with padding for mobile tabs */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-6">
          

          {/* Portfolio Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <p className={`text-xs flex items-center ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalProfit >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {totalProfitPercent >= 0 ? '+' : ''}{totalProfitPercent.toFixed(2)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Profit/Loss</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalProfit >= 0 ? '+' : ''}${totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">24h change</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Best Performer</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">SOL</div>
                <p className="text-xs text-green-600">+16.2%</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assets</CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{portfolioData.length}</div>
                <p className="text-xs text-muted-foreground">Active holdings</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="holdings" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="holdings">Holdings</TabsTrigger>
              <TabsTrigger value="allocation">Allocation</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            
            <TabsContent value="holdings" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Your Holdings</CardTitle>
                      <CardDescription>Current cryptocurrency investments</CardDescription>
                    </div>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Asset
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {portfolioData.map((asset, index) => (
                      <div key={asset.symbol} className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-lg transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="font-bold text-sm">{asset.symbol.charAt(0)}</span>
                          </div>
                          <div>
                            <h3 className="font-medium">{asset.name}</h3>
                            <p className="text-sm text-muted-foreground">{asset.amount} {asset.symbol}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-medium">${asset.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          <div className={`flex items-center text-sm justify-end ${asset.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {asset.profit >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                            {asset.profit >= 0 ? '+' : ''}{asset.profitPercent.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="allocation" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio Allocation</CardTitle>
                  <CardDescription>Distribution of your investments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Visual Allocation */}
                    <div className="space-y-3">
                      {allocationData.map((item, index) => (
                        <div key={item.name} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                              <span className="text-sm font-medium">{item.name}</span>
                            </div>
                            <span className="text-sm">{item.percentage}%</span>
                          </div>
                          <Progress value={item.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                    
                    {/* Allocation Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {allocationData.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full ${item.color} flex items-center justify-center`}>
                              <span className="text-xs font-bold text-white">{item.name.charAt(0)}</span>
                            </div>
                            <div>
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="text-sm text-muted-foreground">{item.percentage}% of portfolio</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${item.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your latest transactions and trades</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentTransactions.map((transaction, index) => (
                      <div key={index} className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-lg transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.type === 'buy' ? 'bg-green-100 text-green-600' :
                            transaction.type === 'sell' ? 'bg-red-100 text-red-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {transaction.type === 'buy' ? <ArrowDownRight className="h-5 w-5" /> :
                             transaction.type === 'sell' ? <ArrowUpRight className="h-5 w-5" /> :
                             <Activity className="h-5 w-5" />}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium capitalize">{transaction.type}</h3>
                              <Badge variant="outline" className="text-xs">
                                {transaction.asset}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{transaction.date}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-medium">
                            {transaction.type === 'buy' ? '-' : transaction.type === 'sell' ? '+' : ''}
                            {transaction.amount} {transaction.asset}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ${transaction.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
