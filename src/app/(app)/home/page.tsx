"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Bitcoin,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Clock,
  BarChart3,
  Wallet,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import RewardServicesDisplay from "@/components/reward-services-display";

// Mock CCXT data structure
interface Cryptocurrency {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  icon: React.ReactNode;
}

interface MarketData {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  topCryptocurrencies: Cryptocurrency[];
}

interface Trade {
  id: string;
  pair: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
}

const mockMarketData: MarketData = {
  totalMarketCap: 2400000000000,
  totalVolume24h: 120000000000,
  btcDominance: 48.5,
  topCryptocurrencies: [
    {
      symbol: 'BTC/USDT',
      name: 'Bitcoin',
      price: 43250.50,
      change24h: 2.5,
      volume24h: 28000000000,
      marketCap: 845000000000,
      icon: <Bitcoin className="h-5 w-5 text-orange-500" />
    },
    {
      symbol: 'ETH/USDT',
      name: 'Ethereum',
      price: 2250.75,
      change24h: -1.2,
      volume24h: 15000000000,
      marketCap: 270000000000,
      icon: <div className="h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">ETH</div>
    },
    {
      symbol: 'BNB/USDT',
      name: 'Binance Coin',
      price: 315.40,
      change24h: 3.8,
      volume24h: 1200000000,
      marketCap: 48000000000,
      icon: <div className="h-5 w-5 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">BNB</div>
    },
    {
      symbol: 'SOL/USDT',
      name: 'Solana',
      price: 98.25,
      change24h: 5.2,
      volume24h: 850000000,
      marketCap: 42000000000,
      icon: <div className="h-5 w-5 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">SOL</div>
    }
  ]
};

const mockTrades: Trade[] = [
  {
    id: '1',
    pair: 'BTC/USDT',
    type: 'buy',
    amount: 0.05,
    price: 43200,
    timestamp: '2024-01-15T14:30:00Z',
    status: 'completed'
  },
  {
    id: '2',
    pair: 'ETH/USDT',
    type: 'sell',
    amount: 2.3,
    price: 2260,
    timestamp: '2024-01-15T12:15:00Z',
    status: 'completed'
  },
  {
    id: '3',
    pair: 'BNB/USDT',
    type: 'buy',
    amount: 10,
    price: 312,
    timestamp: '2024-01-15T10:45:00Z',
    status: 'pending'
  }
];

export default function HomePage() {
  const { session, loading, signOut } = useAuth();
  const router = useRouter();
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    if (!loading && !session) {
      router.push("/signin");
    }
  }, [session, loading, router]);

  useEffect(() => {
    // Simulate CCXT data fetching
    const fetchMarketData = async () => {
      setIsLoading(true);
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setMarketData(mockMarketData);
        setTrades(mockTrades);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Failed to fetch market data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchMarketData();
      
      // Set up real-time updates every 30 seconds
      const interval = setInterval(fetchMarketData, 30000);
      
      return () => clearInterval(interval);
    }
  }, [session]);

  const formatCurrency = (value: number): string => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
            <Bitcoin className="absolute inset-0 m-auto text-primary size-6" />
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      {/* Main content area with padding for mobile tabs */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-6">
          {/* Header with Welcome and Refresh */}
          <div className="flex justify-between items-start mb-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text text-transparent">
                Welcome back!
              </h1>
              <p className="text-muted-foreground">
                Track your portfolio and explore the markets
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* Market Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium">Total Market Cap</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold">
                  {marketData ? formatCurrency(marketData.totalMarketCap) : '$0'}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  +2.5% today
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium">24h Volume</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold">
                  {marketData ? formatCurrency(marketData.totalVolume24h) : '$0'}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  +12.3% from yesterday
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium">BTC Dominance</CardTitle>
                <Bitcoin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold">
                  {marketData ? `${marketData.btcDominance}%` : '0%'}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-red-600" />
                  -0.8% today
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium">Active Markets</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold">1,247</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  +23 new today
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Cryptocurrencies */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Top Cryptocurrencies
                  </CardTitle>
                  <CardDescription>
                    Real-time market data from multiple exchanges via CCXT
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {lastUpdated.toLocaleTimeString()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner variant="bars" size={24} className="text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  {marketData?.topCryptocurrencies.map((crypto, index) => (
                    <div key={crypto.symbol} className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="text-lg font-bold text-muted-foreground">
                          #{index + 1}
                        </div>
                        <div className="flex items-center gap-2">
                          {crypto.icon}
                          <div>
                            <div className="font-medium">{crypto.name}</div>
                            <div className="text-sm text-muted-foreground">{crypto.symbol}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="font-semibold">${formatNumber(crypto.price)}</div>
                          <div className="text-sm text-muted-foreground">
                            Vol: {formatCurrency(crypto.volume24h)}
                          </div>
                        </div>
                        
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                          crypto.change24h >= 0 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {crypto.change24h >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {Math.abs(crypto.change24h).toFixed(2)}%
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/trade?symbol=${crypto.symbol}`)}
                          className="flex items-center gap-1"
                        >
                          Trade
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button 
                className="h-16 flex flex-col items-center justify-center bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-sm hover:shadow-md transition-all duration-200"
                onClick={() => router.push("/trade")}
              >
                <TrendingUp className="h-5 w-5 mb-1" />
                <span>Start Trading</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 flex flex-col items-center justify-center border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors"
                onClick={() => router.push("/portfolio")}
              >
                <BarChart3 className="h-5 w-5 mb-1" />
                <span>My Portfolio</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 flex flex-col items-center justify-center border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors"
                onClick={() => router.push("/wallet")}
              >
                <Wallet className="h-5 w-5 mb-1" />
                <span>Wallet</span>
              </Button>
            </div>
          </div>

          {/* Recent Trades */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest trades and transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trades.map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between p-4 rounded-lg border border-border/50">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${
                        trade.type === 'buy' 
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' 
                          : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {trade.type === 'buy' ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {trade.type === 'buy' ? 'Bought' : 'Sold'} {trade.amount} {trade.pair.split('/')[0]}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatTime(trade.timestamp)} • ${formatNumber(trade.price)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={
                          trade.status === 'completed' ? 'default' :
                          trade.status === 'pending' ? 'secondary' : 'destructive'
                        }
                      >
                        {trade.status}
                      </Badge>
                      <div className="text-right">
                        <p className={`font-medium ${
                          trade.type === 'buy' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {trade.type === 'buy' ? '-' : '+'}${formatNumber(trade.amount * trade.price)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Reward Services Section */}
          <RewardServicesDisplay />
        </div>
      </div>
    </div>
  );
}
