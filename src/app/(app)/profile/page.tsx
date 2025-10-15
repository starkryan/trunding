"use client";

import { useEffect, useState, useId } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  FiUser,
  FiMail,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { FaCreditCard, FaShieldAlt, FaSignOutAlt, FaExchangeAlt, FaWallet, FaSpinner, FaFileContract, FaLock, FaGift, FaShare, FaCopy, FaUsers, FaLink, FaTrophy, FaChartLine, FaCheckCircle } from "react-icons/fa";
import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { InputGroup, InputGroupAddon, InputGroupText } from "@/components/ui/input-group";

export default function ProfilePage() {
  const router = useRouter();
  const { session, loading, signOut } = useAuth();
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const id = useId();
  const [walletData, setWalletData] = useState<{
    balance: number;
    currency: string;
    totalTransactions: number;
    totalDeposits: number;
    totalWithdrawals: number;
  } | null>(null);
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);
  const [referralData, setReferralData] = useState<{
    referralCode: string;
    isActive: boolean;
    expiresAt: string | null;
    stats: {
      totalReferrals: number;
      completedReferrals: number;
      totalEarnings: number;
    };
  } | null>(null);
  const [referralBaseUrl, setReferralBaseUrl] = useState<string>('https://montra.in');
  const [isLoadingReferral, setIsLoadingReferral] = useState(true);
  const [copiedItem, setCopiedItem] = useState<'code' | 'link' | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync isDarkMode with actual theme
  useEffect(() => {
    if (mounted) {
      const actualTheme = theme === 'system' ? systemTheme : theme;
      setIsDarkMode(actualTheme === 'dark');
    }
  }, [theme, systemTheme, mounted]);

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
          if (data.success) {
            setWalletData({
              balance: data.wallet.balance,
              currency: data.wallet.currency,
              totalTransactions: data.stats.totalTransactions,
              totalDeposits: data.stats.totalDeposits,
              totalWithdrawals: data.stats.totalWithdrawals,
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch wallet data:", error);
      } finally {
        setIsLoadingWallet(false);
      }
    };

    if (session) {
      fetchWalletData();
      fetchReferralData();
      fetchReferralBaseUrl();
    }
  }, [session]);

  // Fetch referral base URL
  const fetchReferralBaseUrl = async () => {
    try {
      const response = await fetch('/api/referral/base-url');
      const data = await response.json();
      setReferralBaseUrl(data.baseUrl || 'https://montra.in');
    } catch (error) {
      console.error('Failed to fetch referral base URL:', error);
      setReferralBaseUrl('https://montra.in'); // Fallback
    }
  };

  // Fetch referral data
  const fetchReferralData = async () => {
    try {
      const response = await fetch('/api/referral/code');
      if (response.ok) {
        const data = await response.json();
        setReferralData({
          referralCode: data.referralCode.code,
          isActive: data.referralCode.isActive,
          expiresAt: data.referralCode.expiresAt,
          stats: data.stats
        });
      }
    } catch (error) {
      console.error("Failed to fetch referral data:", error);
    } finally {
      setIsLoadingReferral(false);
    }
  };

  
  const handleSignOut = async () => {
    await signOut();
    router.push("/signin");
  };

  // Handle theme switching
  const handleThemeChange = (checked: boolean) => {
    const newTheme = checked ? 'dark' : 'light';
    setTheme(newTheme);
    setIsDarkMode(checked);
  };

  // Copy referral code to clipboard
  const copyReferralCode = () => {
    if (referralData?.referralCode) {
      navigator.clipboard.writeText(referralData.referralCode);
      setCopiedItem('code');
      setTimeout(() => setCopiedItem(null), 2000);
    }
  };

  // Copy referral link to clipboard
  const copyReferralLink = async () => {
    if (referralData?.referralCode) {
      const referralUrl = `${referralBaseUrl}/signup?ref=${referralData.referralCode}`;
      navigator.clipboard.writeText(referralUrl);
      setCopiedItem('link');
      setTimeout(() => setCopiedItem(null), 2000);
    }
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Show loading state while checking authentication
  if (loading || !mounted) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-16 h-16">
              <Image
                src="/logo.png"
                alt="Mintward Logo"
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

  // Don't render if user is not authenticated
  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      <Card className="flex-1 w-full rounded-none shadow-none border-0 bg-background sm:rounded-lg sm:shadow-lg sm:border sm:max-w-2xl mx-auto my-4 sm:my-8 overflow-y-auto">
       

        <CardContent className="px-4 sm:px-6 space-y-4 sm:space-y-6">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="relative">
                <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-background shadow-lg">
                  <AvatarImage src={session.user.image || ""} alt={session.user.name} />
                  <AvatarFallback className="text-xl sm:text-2xl font-bold bg-primary text-primary-foreground">
                    {session.user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1.5 border-2 border-background">
                  <FaCheckCircle className="h-4 w-4 text-white" />
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                  <h2 className="text-xl sm:text-2xl font-bold">{session.user.name}</h2>
                  <FaCheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-muted-foreground text-sm mb-3 flex items-center justify-center sm:justify-start gap-1">
                  <FiMail className="h-4 w-4" />
                  {session.user.email}
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Active since {new Date(session.user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Badge>
                  <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                    Verified User
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Wallet Balance Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500 rounded-lg">
                  <FaWallet className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">Wallet Balance</h3>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Available for withdrawal</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/withdrawal")}
                className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
              >
                <FaCreditCard className="h-4 w-4 mr-2" />
                Withdraw
              </Button>
            </div>

            {isLoadingWallet ? (
              <div className="flex items-center justify-center py-8">
                <FaSpinner className="h-5 w-5 animate-spin mr-2 text-emerald-600" />
                <span className="text-sm text-emerald-600">Loading balance...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white dark:bg-emerald-900/30 rounded-lg p-4 border border-emerald-200 dark:border-emerald-700">
                  <InputGroup className="h-14">
                    <InputGroupAddon align="inline-start">
                      <InputGroupText className="bg-emerald-50 dark:bg-emerald-800 border-emerald-200 dark:border-emerald-700">
                        {walletData?.currency || 'INR'}
                      </InputGroupText>
                    </InputGroupAddon>
                    <div className="flex-1 flex items-center px-4 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                      {walletData ? walletData.balance.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      }) : '0.00'}
                    </div>
                  </InputGroup>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-700">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                      <FaTrophy className="h-4 w-4" />
                      <span className="text-xs font-medium">Total Deposits</span>
                    </div>
                    <div className="font-bold text-lg text-emerald-700 dark:text-emerald-300">
                      +₹{walletData?.totalDeposits.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      }) || '0.00'}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-700">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                      <FaExchangeAlt className="h-4 w-4" />
                      <span className="text-xs font-medium">Transactions</span>
                    </div>
                    <div className="font-bold text-lg text-emerald-700 dark:text-emerald-300">
                      {walletData?.totalTransactions || 0}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Referral Program */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <FaUsers className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">Referral Program</h3>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Earn rewards by inviting friends</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={copyReferralLink}
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                {copiedItem === 'link' ? (
                  <>
                    <FaCheckCircle className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <FaShare className="h-4 w-4 mr-2" />
                    Share
                  </>
                )}
              </Button>
            </div>

            {isLoadingReferral ? (
              <div className="flex items-center justify-center py-8">
                <FaSpinner className="h-5 w-5 animate-spin mr-2 text-blue-600" />
                <span className="text-sm text-blue-600">Loading referral info...</span>
              </div>
            ) : referralData ? (
              <div className="space-y-4">
                <div className="bg-white dark:bg-blue-900/30 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Your Referral Code</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={copyReferralCode}
                      className="h-8 px-3 text-xs border-blue-500 text-blue-600 hover:bg-blue-50"
                    >
                      {copiedItem === 'code' ? (
                        <>
                          <FaCheckCircle className="h-3 w-3 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <FaCopy className="h-3 w-3 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 flex items-center justify-between">
                    <code className="text-base font-mono font-bold text-gray-800 dark:text-gray-200">{referralData.referralCode}</code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={copyReferralLink}
                      className="h-8 px-3 text-blue-600 hover:bg-blue-50"
                    >
                      {copiedItem === 'link' ? (
                        <>
                          <FaCheckCircle className="h-3 w-3" />
                        </>
                      ) : (
                        <FaShare className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700 text-center">
                    <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                      <FaUsers className="h-4 w-4" />
                      <span className="text-xs font-medium">Total Referrals</span>
                    </div>
                    <div className="font-bold text-2xl text-blue-800 dark:text-blue-200">
                      {referralData.stats.totalReferrals}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      {referralData.stats.completedReferrals} completed
                    </div>
                  </div>
                  <div className="bg-white dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700 text-center">
                    <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 mb-2">
                      <FaGift className="h-4 w-4" />
                      <span className="text-xs font-medium">Total Earnings</span>
                    </div>
                    <div className="font-bold text-2xl text-green-700 dark:text-green-300">
                      {formatCurrency(referralData.stats.totalEarnings)}
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400">
                      Available for withdrawal
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FaUsers className="h-8 w-8 mx-auto mb-2 text-blue-400" />
                <p className="text-sm text-blue-600 dark:text-blue-400">Referral program not available</p>
              </div>
            )}
          </div>

          {/* Theme Settings */}
          <div className="bg-muted/30 rounded-lg p-4 sm:p-6 border border-muted-foreground/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary rounded-lg">
                  <FaShieldAlt className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Appearance</h3>
                  <p className="text-xs text-muted-foreground">Customize your theme</p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor={id} className="text-sm font-medium">Dark Mode</Label>
                  <p className="text-xs text-muted-foreground">Switch between light and dark themes</p>
                </div>
                <div className="relative inline-grid h-9 grid-cols-[1fr_1fr] items-center text-sm font-medium">
                  <Switch
                    id={id}
                    checked={isDarkMode}
                    onCheckedChange={handleThemeChange}
                    className="peer data-[state=unchecked]:bg-input/50 absolute inset-0 h-[inherit] w-auto rounded-md [&_span]:z-10 [&_span]:h-full [&_span]:w-1/2 [&_span]:rounded-sm [&_span]:transition-transform [&_span]:duration-300 [&_span]:ease-[cubic-bezier(0.16,1,0.3,1)] [&_span]:data-[state=checked]:translate-x-full [&_span]:data-[state=checked]:rtl:-translate-x-full"
                  />
                  <span className="pointer-events-none relative ms-0.5 flex items-center justify-center px-2 text-center transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] peer-data-[state=checked]:invisible peer-data-[state=unchecked]:translate-x-full peer-data-[state=unchecked]:rtl:-translate-x-full">
                    <span className="text-[10px] font-medium uppercase">Light</span>
                  </span>
                  <span className="peer-data-[state=checked]:text-background pointer-events-none relative me-0.5 flex items-center justify-center px-2 text-center transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] peer-data-[state=checked]:-translate-x-full peer-data-[state=unchecked]:invisible peer-data-[state=checked]:rtl:translate-x-full">
                    <span className="text-[10px] font-medium uppercase">Dark</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-6 px-4 sm:px-6 pb-6 sm:pb-8">
          {/* Quick Actions */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground text-center">Quick Actions</h4>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <Button
                type="button"
                variant="outline"
                className="h-14 p-3 flex-col items-center justify-center text-xs gap-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 group"
                onClick={() => router.push("/transactions")}
              >
                <FaExchangeAlt className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Transactions</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-14 p-3 flex-col items-center justify-center text-xs gap-2 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all duration-200 group"
                onClick={() => router.push("/withdrawal")}
              >
                <FaCreditCard className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Withdraw</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-14 p-3 flex-col items-center justify-center text-xs gap-2 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all duration-200 group"
                onClick={copyReferralLink}
              >
                {copiedItem === 'link' ? (
                  <>
                    <FaCheckCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <FaShare className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Share</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Legal & Support */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground text-center">Legal & Support</h4>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <Button
                type="button"
                variant="outline"
                className="h-12 p-3 flex-col items-center justify-center text-xs gap-2 hover:bg-muted hover:text-muted-foreground transition-all duration-200 group"
                onClick={() => router.push("/terms")}
              >
                <FaFileContract className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Terms</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-12 p-3 flex-col items-center justify-center text-xs gap-2 hover:bg-muted hover:text-muted-foreground transition-all duration-200 group"
                onClick={() => router.push("/privacy")}
              >
                <FaLock className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Privacy</span>
              </Button>
            </div>
          </div>

          {/* Sign Out */}
          <div className="pt-4 border-t border-muted-foreground/20">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-base font-medium border-destructive/30 text-destructive hover:border-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 group"
              onClick={handleSignOut}
            >
              <FaSignOutAlt className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
              Sign Out
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
