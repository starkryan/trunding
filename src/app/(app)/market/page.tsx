"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Search, Star } from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function MarketPage() {
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
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
            <TrendingUp className="absolute inset-0 m-auto text-primary size-6" />
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const marketData = [
    {
      symbol: "BTC",
      name: "Bitcoin",
      price: 45231.89,
      change: 2.5,
      changePercent: 5.8,
      volume: "28.5B",
      marketCap: "885.2B"
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      price: 3124.56,
      change: -45.23,
      changePercent: -1.4,
      volume: "15.2B",
      marketCap: "375.8B"
    },
    {
      symbol: "BNB",
      name: "Binance Coin",
      price: 412.34,
      change: 12.45,
      changePercent: 3.1,
      volume: "2.1B",
      marketCap: "63.4B"
    },
    {
      symbol: "SOL",
      name: "Solana",
      price: 98.76,
      change: 5.67,
      changePercent: 6.1,
      volume: "3.8B",
      marketCap: "42.1B"
    },
    {
      symbol: "ADA",
      name: "Cardano",
      price: 0.58,
      change: -0.02,
      changePercent: -3.3,
      volume: "892M",
      marketCap: "20.5B"
    },
    {
      symbol: "DOT",
      name: "Polkadot",
      price: 7.23,
      change: 0.45,
      changePercent: 6.6,
      volume: "445M",
      marketCap: "9.2B"
    }
  ];

  // Price chart data for Bitcoin
  const priceData = [
    { time: "00:00", price: 44000 },
    { time: "04:00", price: 44500 },
    { time: "08:00", price: 44200 },
    { time: "12:00", price: 44800 },
    { time: "16:00", price: 45100 },
    { time: "20:00", price: 44900 },
    { time: "24:00", price: 45231 }
  ];

  // Volume data
  const volumeData = [
    { name: "BTC", volume: 28500000000 },
    { name: "ETH", volume: 15200000000 },
    { name: "BNB", volume: 2100000000 },
    { name: "SOL", volume: 3800000000 },
    { name: "ADA", volume: 892000000 },
    { name: "DOT", volume: 445000000 }
  ];

  // Market cap distribution
  const marketCapData = [
    { name: "Bitcoin", value: 885.2, color: "#F7931A" },
    { name: "Ethereum", value: 375.8, color: "#627EEA" },
    { name: "Binance Coin", value: 63.4, color: "#F3BA2F" },
    { name: "Solana", value: 42.1, color: "#00FFA3" },
    { name: "Others", value: 283.5, color: "#808080" }
  ];

  // 24h price changes
  const priceChangeData = [
    { name: "BTC", change: 5.8 },
    { name: "ETH", change: -1.4 },
    { name: "BNB", change: 3.1 },
    { name: "SOL", change: 6.1 },
    { name: "ADA", change: -3.3 },
    { name: "DOT", change: 6.6 }
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      {/* Header Section */}
      <div className="px-6 py-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <TrendingUp className="h-8 w-8 text-primary" />
        </div>
        <div className="max-w-md">
          <h1 className="text-3xl font-bold mb-3">Market</h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Track real-time cryptocurrency prices, market trends, and trading volumes. Make informed investment decisions with comprehensive market data.
          </p>
        </div>
      </div>

      {/* Main content area with padding for mobile tabs */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="px-6">


          {/* Market Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <Card className="border-muted-foreground/20">
              <CardContent className="p-6">
                <div className="text-2xl font-bold mb-2">$1.85T</div>
                <p className="text-sm text-muted-foreground mb-3">Total Market Cap</p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +2.4% (24h)
                </p>
              </CardContent>
            </Card>

            <Card className="border-muted-foreground/20">
              <CardContent className="p-6">
                <div className="text-2xl font-bold mb-2">$89.2B</div>
                <p className="text-sm text-muted-foreground mb-3">24h Volume</p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12.8% (24h)
                </p>
              </CardContent>
            </Card>

            <Card className="border-muted-foreground/20">
              <CardContent className="p-6">
                <div className="text-2xl font-bold mb-2">47.8%</div>
                <p className="text-sm text-muted-foreground mb-3">BTC Dominance</p>
                <p className="text-xs text-red-600 flex items-center">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  -0.3% (24h)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Trading Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {/* Price Chart */}
            <Card className="border-muted-foreground/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2">Bitcoin Price (24h)</h3>
                <p className="text-sm text-muted-foreground mb-4">Real-time price movement</p>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={priceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} domain={['dataMin - 500', 'dataMax + 500']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem' }}
                      labelStyle={{ color: '#f9fafb' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#3b82f6"
                      fill="url(#colorGradient)"
                      strokeWidth={2}
                    />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Volume Chart */}
            <Card className="border-muted-foreground/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2">Trading Volume (24h)</h3>
                <p className="text-sm text-muted-foreground mb-4">Volume by cryptocurrency</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={volumeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem' }}
                      labelStyle={{ color: '#f9fafb' }}
                      formatter={(value: number) => [`$${(value / 1000000000).toFixed(1)}B`, 'Volume']}
                    />
                    <Bar dataKey="volume" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Market Cap Distribution and Price Changes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {/* Market Cap Pie Chart */}
            <Card className="border-muted-foreground/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2">Market Cap Distribution</h3>
                <p className="text-sm text-muted-foreground mb-4">Market capitalization by cryptocurrency</p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={marketCapData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {marketCapData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem' }}
                      labelStyle={{ color: '#f9fafb' }}
                      formatter={(value) => [`$${value}B`, 'Market Cap']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {marketCapData.map((item, index) => (
                    <div key={index} className="flex items-center space-x-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-xs">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Price Changes Bar Chart */}
            <Card className="border-muted-foreground/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2">24h Price Changes</h3>
                <p className="text-sm text-muted-foreground mb-4">Percentage change by cryptocurrency</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={priceChangeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem' }}
                      labelStyle={{ color: '#f9fafb' }}
                      formatter={(value: number) => [`${value}%`, 'Change']}
                    />
                    <Bar dataKey="change" radius={[4, 4, 0, 0]}>
                      {priceChangeData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.change >= 0 ? '#10b981' : '#ef4444'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <div className="mb-6">
            <div className="relative group">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 size-5 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="Search cryptocurrencies..."
                className="w-full pl-12 h-12 bg-muted/30 rounded-lg border border-muted-foreground/20 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Market List */}
          <Card className="border-muted-foreground/20">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Cryptocurrencies</h3>
              <p className="text-sm text-muted-foreground mb-4">Real-time prices and market data</p>
              <div className="space-y-4">
                {marketData.map((crypto, index) => (
                  <div key={crypto.symbol} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="font-bold text-sm">{crypto.symbol.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{crypto.name}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {crypto.symbol}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Vol: {crypto.volume}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-medium">${crypto.price.toLocaleString()}</div>
                      <div className={`flex items-center text-sm ${crypto.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {crypto.change >= 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {crypto.changePercent >= 0 ? '+' : ''}{crypto.changePercent}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Watchlist */}
          <Card className="border-muted-foreground/20 mt-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Your Watchlist</h3>
              <p className="text-sm text-muted-foreground mb-4">Cryptocurrencies you're tracking</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <div>
                      <h4 className="font-medium">Bitcoin (BTC)</h4>
                      <p className="text-sm text-muted-foreground">$45,231.89</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-600">
                    +5.8%
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <div>
                      <h4 className="font-medium">Ethereum (ETH)</h4>
                      <p className="text-sm text-muted-foreground">$3,124.56</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-red-600">
                    -1.4%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
