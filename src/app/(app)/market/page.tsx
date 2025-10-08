"use client";

import { useState, useEffect } from "react";
import { FiSearch, FiTrendingUp, FiTrendingDown, FiRefreshCw } from "react-icons/fi";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
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

export default function MarketPage() {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [filteredData, setFilteredData] = useState<CryptoData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

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

        {/* Search Section */}
        <div className="mb-8 shadow-lg border border-muted-foreground/10 rounded-lg bg-background">
          <div className="p-6">
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <FiSearch 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/70 size-5 pointer-events-none" 
                />
                <Input
                  type="text"
                  placeholder="Search ...."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 text-base border-muted-foreground/20 focus:border-primary/50"
                />
              </div>
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-12 px-4 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-sm hover:shadow-md transition-all duration-200"
              >
                {isRefreshing ? (
                  <span className="flex items-center gap-2">
                    <Spinner variant="bars" size={16} />
                    <span>Refresh</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <FiRefreshCw size={18} />
                    <span>Refresh</span>
                  </span>
                )}
              </Button>
            </div>
            
            {searchTerm && (
              <div className="mt-4 text-sm text-muted-foreground">
                Found {filteredData.length} {filteredData.length === 1 ? "result" : "results"} for "{searchTerm}"
              </div>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 border border-destructive/20 bg-destructive/5 rounded-lg">
            <div className="p-6">
              <div className="flex items-center gap-3 text-destructive">
                <div className="w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
                <span>{error}</span>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!error && filteredData.length === 0 && searchTerm && (
          <div className="mb-8 border border-muted-foreground/10 rounded-lg bg-background">
            <div className="p-12 text-center">
              <div className="space-y-4">
                <FiSearch className="mx-auto size-12 text-muted-foreground/40" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">No cryptocurrencies found</h3>
                  
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Crypto Grid */}
        {filteredData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredData.map((crypto) => (
              <div 
                key={crypto.symbol} 
                className="border border-muted-foreground/10 rounded-lg bg-background shadow-lg hover:shadow-xl transition-all duration-200 hover:border-primary/20 group"
              >
                <div className="p-6 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                        {crypto.symbol}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {crypto.name}
                      </p>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium ${
                      isPositive(crypto.changePercent24h) 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" 
                        : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                    }`}>
                      {isPositive(crypto.changePercent24h) ? (
                        <FiTrendingUp size={14} />
                      ) : (
                        <FiTrendingDown size={14} />
                      )}
                      {formatPercent(crypto.changePercent24h)}
                    </div>
                  </div>
                </div>
                
                <div className="px-6 pb-6 space-y-4">
                  <div className="space-y-2">
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
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="text-muted-foreground">24h High</div>
                      <div className="font-medium">{formatPrice(crypto.high24h)}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground">24h Low</div>
                      <div className="font-medium">{formatPrice(crypto.low24h)}</div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-muted-foreground/10">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">24h Volume</span>
                      <span className="font-medium">{formatVolume(crypto.quoteVolume24h)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      
      </div>
    </div>
  );
}
