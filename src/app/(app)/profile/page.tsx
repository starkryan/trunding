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
import { FaCreditCard, FaShieldAlt, FaSignOutAlt, FaExchangeAlt, FaWallet, FaSpinner } from "react-icons/fa";
import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { InputGroup, InputGroupAddon, InputGroupText } from "@/components/ui/input-group";

export default function ProfilePage() {
  const router = useRouter();
  const { session, loading, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const id = useId();
  const [walletData, setWalletData] = useState<{
    balance: number;
    currency: string;
    totalTransactions: number;
    totalDeposits: number;
    totalWithdrawals: number;
  } | null>(null);
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    }
  }, [session]);

  
  const handleSignOut = async () => {
    await signOut();
    router.push("/signin");
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

  // Don't render if user is not authenticated
  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      <Card className="flex-1 w-full rounded-none shadow-none border-0 bg-background sm:rounded-lg sm:shadow-lg sm:border sm:max-w-2xl mx-auto my-4 sm:my-8 overflow-y-auto">
       

        <CardContent className="px-4 sm:px-6 space-y-4 sm:space-y-6">
          {/* Profile Header */}
          <div className="flex flex-col items-center space-y-3 sm:space-y-4">
            <div className="relative">
              <Avatar className="w-16 h-16 sm:w-20 sm:h-20">
                <AvatarImage src={session.user.image || ""} alt={session.user.name} />
                <AvatarFallback className="text-lg sm:text-xl">
                  {session.user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="text-center">
              <h3 className="text-lg sm:text-xl font-semibold">{session.user.name}</h3>
              <div className="flex items-center gap-2 mt-1 justify-center">
                <Badge variant="secondary" className="text-xs">Active since {new Date(session.user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</Badge>
              </div>
            </div>
          </div>

          {/* Wallet Balance Card */}
          <div className="bg-muted/30 rounded-lg p-4 sm:p-6 border border-muted-foreground/20">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <FaWallet className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Wallet Balance</h3>
              </div>
              
              {isLoadingWallet ? (
                <div className="flex items-center justify-center py-4">
                  <FaSpinner className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Loading balance...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <InputGroup className="h-12">
                    <InputGroupAddon align="inline-start">
                      <InputGroupText>
                        {walletData?.currency || 'INR'}
                      </InputGroupText>
                    </InputGroupAddon>
                    <div className="flex-1 flex items-center px-3 text-xl font-bold">
                      {walletData ? walletData.balance.toLocaleString('en-IN', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      }) : '0.00'}
                    </div>
                  </InputGroup>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-background/50 rounded p-2">
                      <div className="text-muted-foreground">Total Deposits</div>
                      <div className="font-semibold text-green-600">
                        +₹{walletData?.totalDeposits.toLocaleString('en-IN', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        }) || '0.00'}
                      </div>
                    </div>
                    <div className="bg-background/50 rounded p-2">
                      <div className="text-muted-foreground">Transactions</div>
                      <div className="font-semibold">
                        {walletData?.totalTransactions || 0}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Profile Information */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
              <div className="relative group">
                <FiUser
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 size-5 pointer-events-none"
                  aria-hidden="true"
                />
                <div className="pl-12 h-12 flex items-center text-base bg-muted/30 rounded-lg border border-muted-foreground/20">
                  {session.user.name}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Email Address</label>
              <div className="relative group">
                <FiMail
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 size-5 pointer-events-none"
                  aria-hidden="true"
                />
                <div className="pl-12 h-12 flex items-center text-base bg-muted/30 rounded-lg border border-muted-foreground/20">
                  {session.user.email}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={id} className="text-sm font-medium text-muted-foreground">Theme</Label>
              <div className="flex items-center space-x-3">
                <div className="relative inline-grid h-9 grid-cols-[1fr_1fr] items-center text-sm font-medium">
                  <Switch
                    id={id}
                    checked={theme === 'dark'}
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
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

        <CardFooter className="flex flex-col space-y-4 px-4 sm:px-6 pb-6 sm:pb-8">
          <div className="relative w-full my-4" role="separator" aria-label="Quick actions">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted-foreground/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-3 text-muted-foreground">Quick Actions</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-12 p-2 flex-col items-center justify-center text-xs gap-1"
              onClick={() => router.push("/transactions")}
            >
              <FaExchangeAlt className="h-4 w-4" />
              Transactions
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-12 p-2 flex-col items-center justify-center text-xs gap-1"
            >
              <FaShieldAlt className="h-4 w-4" />
              Security
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            <FaSignOutAlt className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
