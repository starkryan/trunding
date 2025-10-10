"use client";

import { useState, useEffect, useMemo } from "react";
import {
  FiSearch, FiTrendingUp, FiTrendingDown, FiRefreshCw, FiBarChart2,
  FiActivity, FiDollarSign, FiStar, FiChevronUp, FiChevronDown,
  FiDatabase
} from "react-icons/fi";
import {
  FaBitcoin, FaEthereum, FaCoins, FaChartLine, FaExchangeAlt,
  FaGem, FaCircle, FaShieldAlt, FaBolt, FaDollarSign, FaStar
} from "react-icons/fa";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart, Line, AreaChart, Area, Tooltip, ResponsiveContainer
} from "recharts";
import toast from "react-hot-toast";

interface CryptoData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: string;
  quoteVolume24h: string;
  high24h: number;
  low24h: number;
}

interface CryptoResponse {
  success: boolean;
  data?: CryptoData[];
  total?: number;
  timestamp?: string;
  error?: string;
}

// Icon mapping for different cryptocurrencies using FontAwesome
const getCryptoIcon = (symbol: string) => {
  const iconMap: { [key: string]: React.ReactNode } = {
    // Major cryptocurrencies with appropriate icons
    'BTC': <FaBitcoin className="text-orange-500" />,
    'ETH': <FaEthereum className="text-blue-600" />,
    'BNB': <FaStar className="text-yellow-500" />,
    'USDT': <FaDollarSign className="text-green-600" />,
    'USDC': <FaCircle className="text-blue-500" />,
    'XRP': <FaExchangeAlt className="text-gray-700 dark:text-gray-300" />,
    'SOL': <FaBolt className="text-purple-500" />,
    'ADA': <FaGem className="text-blue-500" />,
    'DOGE': <FaStar className="text-yellow-400" />,
    'DOT': <FaCircle className="text-pink-500" />,
    'MATIC': <FaCoins className="text-purple-600" />,
    'LINK': <FaChartLine className="text-blue-700" />,
    'UNI': <FaExchangeAlt className="text-pink-500" />,
    'LTC': <FaCoins className="text-blue-400" />,
    'ATOM': <FaShieldAlt className="text-blue-600" />,
    'AVAX': <FaChartLine className="text-red-600" />,
    'SHIB': <FaStar className="text-orange-400" />,
    'BCH': <FaBitcoin className="text-orange-600" />,
    'XLM': <FaStar className="text-purple-400" />,
    'VET': <FaChartLine className="text-blue-500" />,
    'FIL': <FaCoins className="text-gray-600" />,
    'TRX': <FaExchangeAlt className="text-red-500" />,
    'ICP': <FaCircle className="text-orange-600" />,
    'HBAR': <FaShieldAlt className="text-gray-700" />,
    'ETC': <FaEthereum className="text-green-600" />,
    'XMR': <FaShieldAlt className="text-orange-600" />,
    'MANA': <FaGem className="text-purple-600" />,
    'SAND': <FaStar className="text-yellow-600" />,
    'AAVE': <FaChartLine className="text-purple-700" />,
    'EGLD': <FaCoins className="text-blue-800" />,
    'FTT': <FaExchangeAlt className="text-cyan-600" />,
    'THETA': <FaBolt className="text-teal-600" />
  };

  return iconMap[symbol] || <FaCoins className="text-muted-foreground" />;
};

// Generate mock price history for charts with realistic up/down patterns
const generateMockPriceData = (currentPrice: number, isPositive: boolean) => {
  const data = [];
  const points = 24;
  let price = currentPrice * (isPositive ? 0.85 : 1.15);
  const trendMultiplier = isPositive ? 1.0015 : 0.9985;
  const volatility = 0.015;

  for (let i = 0; i < points; i++) {
    // Create realistic up/down patterns (like /\/\/\)
    const cyclePosition = i % 6;
    let localTrend = 1;

    // Create wave patterns
    if (cyclePosition === 0 || cyclePosition === 4) {
      localTrend = isPositive ? 1.01 : 0.99;
    } else if (cyclePosition === 1 || cyclePosition === 3) {
      localTrend = 0.995;
    } else if (cyclePosition === 2) {
      localTrend = isPositive ? 1.008 : 0.992;
    } else {
      localTrend = 1.002;
    }

    // Apply trend and volatility
    price = price * trendMultiplier * localTrend * (1 + (Math.random() - 0.5) * volatility);

    // Ensure price stays reasonable
    price = Math.max(price, currentPrice * 0.5);
    price = Math.min(price, currentPrice * 1.5);

    data.push({
      time: `${i}:00`,
      price: parseFloat(price.toFixed(8))
    });
  }

  // Ensure last point is close to current price
  data[data.length - 1].price = currentPrice;

  return data;
};

// Market statistics for overview cards
const generateMarketStats = (cryptoData: CryptoData[]) => {
  if (!cryptoData.length) return [];

  const totalVolume = cryptoData.reduce((sum, crypto) =>
    sum + parseFloat(crypto.quoteVolume24h), 0
  );

  const positiveCount = cryptoData.filter(crypto => crypto.changePercent24h > 0).length;
  const negativeCount = cryptoData.length - positiveCount;

  return [
    {
      title: "Total Volume",
      value: `$${(totalVolume / 1e9).toFixed(2)}B`,
      change: "+2.5%",
      icon: <FiDollarSign className="text-green-600" />,
      color: "text-green-600"
    },
    {
      title: "Market Trend",
      value: positiveCount > negativeCount ? "Bullish" : "Bearish",
      change: `${positiveCount} gainers`,
      icon: positiveCount > negativeCount ?
        <FiTrendingUp className="text-green-600" /> :
        <FiTrendingDown className="text-red-600" />,
      color: positiveCount > negativeCount ? "text-green-600" : "text-red-600"
    },
    {
      title: "Active Cryptos",
      value: cryptoData.length.toString(),
      change: "+12",
      icon: <FiActivity className="text-blue-600" />,
      color: "text-blue-600"
    },
    {
      title: "Top Gainer",
      value: cryptoData.reduce((max, crypto) =>
        crypto.changePercent24h > max.changePercent24h ? crypto : max, cryptoData[0]
      )?.symbol || "N/A",
      change: `+${Math.max(...cryptoData.map(c => c.changePercent24h)).toFixed(2)}%`,
      icon: <FiStar className="text-yellow-600" />,
      color: "text-yellow-600"
    }
  ];
};

export default function MarketPage() {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [filteredData, setFilteredData] = useState<CryptoData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"price" | "change" | "volume">("change");

  // Computed values
  const marketStats = useMemo(() => generateMarketStats(cryptoData), [cryptoData]);

  const sortedAndFilteredData = useMemo(() => {
    let data = [...filteredData];

    // Sort data
    data.sort((a, b) => {
      switch (sortBy) {
        case "price":
          return b.price - a.price;
        case "change":
          return b.changePercent24h - a.changePercent24h;
        case "volume":
          return parseFloat(b.quoteVolume24h) - parseFloat(a.quoteVolume24h);
        default:
          return 0;
      }
    });

    return data;
  }, [filteredData, sortBy]);

  const fetchCryptoData = async (showRefreshToast = false) => {
    try {
      const response = await fetch("/api/crypto?limit=50");
      
      if (!response.ok) {
        throw new Error("Failed to fetch cryptocurrency data");
      }

      const result: CryptoResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch data");
      }

      setCryptoData(result.data || []);
      setFilteredData(result.data || []);
      setError(null);
      
      if (showRefreshToast) {
        toast.success("Market data refreshed successfully!");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load market data");
      toast.error(err.message || "Failed to load market data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCryptoData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredData(cryptoData);
    } else {
      const filtered = cryptoData.filter(
        (crypto) =>
          crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
          crypto.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchTerm, cryptoData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCryptoData(true);
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (price >= 1) {
      return `$${price.toFixed(4)}`;
    } else {
      return `$${price.toFixed(8)}`;
    }
  };

  const formatVolume = (volume: string) => {
    const num = parseFloat(volume);
    if (num >= 1e9) {
      return `$${(num / 1e9).toFixed(2)}B`;
    } else if (num >= 1e6) {
      return `$${(num / 1e6).toFixed(2)}M`;
    } else if (num >= 1e3) {
      return `$${(num / 1e3).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  const formatPercent = (percent: number) => {
    const absPercent = Math.abs(percent);
    return `${absPercent.toFixed(2)}%`;
  };

  const isPositive = (value: number) => value >= 0;

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
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

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 relative">
      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
                <FiBarChart2 className="text-primary" />
                Crypto Market
              </h1>
              <p className="text-muted-foreground">
                Real-time cryptocurrency prices and market data
              </p>
            </div>

            <div className="flex gap-2 items-center">
              <div className="relative flex-1 lg:w-80">
                <FiSearch
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/70 size-5 pointer-events-none"
                />
                <Input
                  type="text"
                  placeholder="Search cryptocurrencies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 text-base border-muted-foreground/20 focus:border-primary/50"
                />
              </div>
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-12 px-6 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-sm hover:shadow-md transition-all duration-200"
              >
                {isRefreshing ? (
                  <Spinner variant="bars" size={16} />
                ) : (
                  <FiRefreshCw size={18} />
                )}
              </Button>
            </div>
          </div>

          {searchTerm && (
            <div className="mt-4 text-sm text-muted-foreground">
              Found {filteredData.length} {filteredData.length === 1 ? "result" : "results"} for "{searchTerm}"
            </div>
          )}
        </div>

        {/* Market Stats Cards */}
        {marketStats.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {marketStats.map((stat, index) => (
              <Card key={index} className="border-muted-foreground/10 bg-gradient-to-br from-background to-muted/5">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className={`text-sm ${stat.color}`}>{stat.change}</p>
                    </div>
                    <div className="text-2xl opacity-50">
                      {stat.icon}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Controls Section */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="flex items-center gap-2"
            >
              <FiDatabase className="size-4" />
              Grid
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="flex items-center gap-2"
            >
              <FiActivity className="size-4" />
              List
            </Button>
          </div>

          <div className="flex gap-2">
            <span className="text-sm text-muted-foreground self-center">Sort by:</span>
            <Button
              variant={sortBy === "change" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("change")}
              className="flex items-center gap-2"
            >
              <FiTrendingUp className="size-4" />
              Change
            </Button>
            <Button
              variant={sortBy === "price" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("price")}
              className="flex items-center gap-2"
            >
              <FiDollarSign className="size-4" />
              Price
            </Button>
            <Button
              variant={sortBy === "volume" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("volume")}
              className="flex items-center gap-2"
            >
              <FiBarChart2 className="size-4" />
              Volume
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-8 border-destructive/20 bg-destructive/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-destructive">
                <div className="w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!error && sortedAndFilteredData.length === 0 && searchTerm && (
          <Card className="mb-8 border-muted-foreground/10">
            <CardContent className="p-12 text-center">
              <div className="space-y-4">
                <FiSearch className="mx-auto size-12 text-muted-foreground/40" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">No cryptocurrencies found</h3>
                  <p className="text-muted-foreground">Try adjusting your search terms</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Crypto Display */}
        {sortedAndFilteredData.length > 0 && (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedAndFilteredData.map((crypto) => (
                  <CryptoCard
                    key={crypto.symbol}
                    crypto={crypto}
                    formatPrice={formatPrice}
                    formatVolume={formatVolume}
                    formatPercent={formatPercent}
                    isPositive={isPositive}
                    getCryptoIcon={getCryptoIcon}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {sortedAndFilteredData.map((crypto) => (
                  <CryptoListItem
                    key={crypto.symbol}
                    crypto={crypto}
                    formatPrice={formatPrice}
                    formatVolume={formatVolume}
                    formatPercent={formatPercent}
                    isPositive={isPositive}
                    getCryptoIcon={getCryptoIcon}
                  />
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}

// Individual crypto card component for grid view
function CryptoCard({
  crypto,
  formatPrice,
  formatVolume,
  formatPercent,
  isPositive,
  getCryptoIcon
}: {
  crypto: CryptoData;
  formatPrice: (price: number) => string;
  formatVolume: (volume: string) => string;
  formatPercent: (percent: number) => string;
  isPositive: (value: number) => boolean;
  getCryptoIcon: (symbol: string) => React.ReactNode;
}) {
  const priceHistory = generateMockPriceData(crypto.price, isPositive(crypto.changePercent24h));

  return (
    <Card className="border-muted-foreground/10 bg-gradient-to-br from-background to-muted/5 hover:shadow-xl transition-all duration-200 hover:border-primary/20 group overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">
              {getCryptoIcon(crypto.symbol)}
            </div>
            <div>
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {crypto.symbol}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {crypto.name}
              </p>
            </div>
          </div>
          <Badge
            variant={isPositive(crypto.changePercent24h) ? "default" : "secondary"}
            className={`flex items-center gap-1 ${
              !isPositive(crypto.changePercent24h) ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400" : ""
            }`}
          >
            {isPositive(crypto.changePercent24h) ? (
              <FiTrendingUp size={12} />
            ) : (
              <FiTrendingDown size={12} />
            )}
            {formatPercent(crypto.changePercent24h)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold">
            {formatPrice(crypto.price)}
          </span>
          <span className={`text-sm font-medium ${
            isPositive(crypto.change24h) ? "text-green-600" : "text-red-600"
          }`}>
            {isPositive(crypto.change24h) ? "+" : ""}
            {formatPrice(crypto.change24h)}
          </span>
        </div>

        {/* Price Chart */}
        <div className="h-24 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={priceHistory}>
              <defs>
                <linearGradient id={`gradient-${crypto.symbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={isPositive(crypto.changePercent24h) ? "#10b981" : "#ef4444"}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={isPositive(crypto.changePercent24h) ? "#10b981" : "#ef4444"}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="price"
                stroke={isPositive(crypto.changePercent24h) ? "#10b981" : "#ef4444"}
                strokeWidth={2}
                fill={`url(#gradient-${crypto.symbol})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <FiChevronUp size={12} />
              24h High
            </div>
            <div className="font-medium">{formatPrice(crypto.high24h)}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <FiChevronDown size={12} />
              24h Low
            </div>
            <div className="font-medium">{formatPrice(crypto.low24h)}</div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm pt-3 border-t border-muted-foreground/10">
          <div className="flex items-center gap-1 text-muted-foreground">
            <FiBarChart2 size={14} />
            24h Volume
          </div>
          <span className="font-medium">{formatVolume(crypto.quoteVolume24h)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// List item component for list view
function CryptoListItem({
  crypto,
  formatPrice,
  formatVolume,
  formatPercent,
  isPositive,
  getCryptoIcon
}: {
  crypto: CryptoData;
  formatPrice: (price: number) => string;
  formatVolume: (volume: string) => string;
  formatPercent: (percent: number) => string;
  isPositive: (value: number) => boolean;
  getCryptoIcon: (symbol: string) => React.ReactNode;
}) {
  const priceHistory = generateMockPriceData(crypto.price, isPositive(crypto.changePercent24h));

  return (
    <Card className="border-muted-foreground/10 bg-gradient-to-r from-background to-muted/5 hover:shadow-lg transition-all duration-200 hover:border-primary/20">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left: Icon and basic info */}
          <div className="flex items-center gap-4 flex-1">
            <div className="text-3xl">
              {getCryptoIcon(crypto.symbol)}
            </div>
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {crypto.symbol}
                <Badge
                  variant={isPositive(crypto.changePercent24h) ? "default" : "secondary"}
                  className={`text-xs ${
                    !isPositive(crypto.changePercent24h) ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400" : ""
                  }`}
                >
                  {isPositive(crypto.changePercent24h) ? (
                    <FiTrendingUp size={10} className="mr-1" />
                  ) : (
                    <FiTrendingDown size={10} className="mr-1" />
                  )}
                  {formatPercent(crypto.changePercent24h)}
                </Badge>
              </h3>
              <p className="text-sm text-muted-foreground">{crypto.name}</p>
            </div>
          </div>

          {/* Center: Mini chart */}
          <div className="flex-1 max-w-xs hidden sm:block">
            <div className="h-16">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceHistory}>
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke={isPositive(crypto.changePercent24h) ? "#10b981" : "#ef4444"}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right: Price and volume info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-8">
            <div className="text-center sm:text-left">
              <div className="text-2xl font-bold">
                {formatPrice(crypto.price)}
              </div>
              <div className={`text-sm font-medium ${
                isPositive(crypto.change24h) ? "text-green-600" : "text-red-600"
              }`}>
                {isPositive(crypto.change24h) ? "+" : ""}
                {formatPrice(crypto.change24h)}
              </div>
            </div>

            <div className="text-center sm:text-left">
              <div className="text-sm text-muted-foreground">24h Volume</div>
              <div className="font-medium">{formatVolume(crypto.quoteVolume24h)}</div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center sm:text-left">
              <div>
                <div className="text-xs text-muted-foreground">High</div>
                <div className="font-medium">{formatPrice(crypto.high24h)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Low</div>
                <div className="font-medium">{formatPrice(crypto.low24h)}</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
