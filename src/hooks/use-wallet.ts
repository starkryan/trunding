"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";

interface WalletData {
  id: string;
  balance: number;
  currency: string;
  updatedAt: string;
}

interface WalletStats {
  totalTransactions: number;
  totalDeposits: number;
  totalWithdrawals: number;
  depositCount: number;
  withdrawalCount: number;
  netFlow: number;
}

interface WalletResponse {
  success: boolean;
  wallet?: WalletData;
  stats?: WalletStats;
  error?: string;
}

export function useWallet() {
  const { session } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = async () => {
    if (!session) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/wallet");
      const data: WalletResponse = await response.json();

      if (data.success && data.wallet) {
        setWallet(data.wallet);
        setStats(data.stats || null);
      } else {
        setError(data.error || "Failed to fetch wallet data");
      }
    } catch (err) {
      setError("Network error while fetching wallet data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchWallet();
    } else {
      setWallet(null);
      setStats(null);
    }
  }, [session]);

  const refetch = () => {
    fetchWallet();
  };

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: wallet?.currency || "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return {
    wallet,
    stats,
    loading,
    error,
    refetch,
    formatBalance,
    balance: wallet?.balance || 0,
  };
}