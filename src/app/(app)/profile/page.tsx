"use client";

import { useEffect, useState, useId } from "react";
import { useRouter } from "next/navigation";
import {
  FiUser,
  FiMail,
  FiCalendar,
  FiSun,
  FiMoon,
  FiMonitor,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { CreditCard, Bell, Shield, LogOut, Wallet as WalletIcon, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { InputGroup, InputGroupAddon, InputGroupText } from "@/components/ui/input-group";

export default function ProfilePage() {
  const router = useRouter();
  const { session, loading, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [walletData, setWalletData] = useState<{
    balance: number;
    currency: string;
  } | null>(null);
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);
  const id = useId();

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
          setWalletData({
            balance: data.wallet?.balance || 0,
            currency: data.wallet?.currency || "USD",
          });
        } else if (response.status === 401) {
          // User is not authenticated, don't show wallet data
          console.log("User not authenticated for wallet data");
        }
      } catch (error) {
        console.error("Failed to fetch wallet data:", error);
      } finally {
        setIsLoadingWallet(false);
      }
    };

    if (session) {
      fetchWalletData();
    } else {
      setIsLoadingWallet(false);
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
        <div className="text-center space-y-4">
          <div className="relative">
            <Spinner variant="bars" size={64} className="text-primary mx-auto" />
            <FiUser className="absolute inset-0 m-auto text-primary size-6" />
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
      <Card className="flex-1 w-full rounded-none shadow-none border-0 bg-background sm:rounded-lg sm:shadow-lg sm:border sm:max-w-2xl mx-auto my-8 overflow-y-auto">
       

        <CardContent className="px-6 space-y-6">
          {/* Profile Header */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src={session.user.image || ""} alt={session.user.name} />
                <AvatarFallback className="text-xl">
                  {session.user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold">{session.user.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">Active since {new Date(session.user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</Badge>
              </div>
            </div>
          </div>

          {/* Wallet Balance Card */}
          <div className="bg-muted/30 rounded-lg p-6 border border-muted-foreground/20">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <WalletIcon className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Wallet Balance</h3>
              </div>
              
              {isLoadingWallet ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Loading balance...</span>
                </div>
              ) : (
                <InputGroup className="h-12">
                  <InputGroupAddon align="inline-start">
                    <InputGroupText>
                      {walletData?.currency || 'USD'}
                    </InputGroupText>
                  </InputGroupAddon>
                  <div className="flex-1 flex items-center px-3 text-xl font-bold">
                    {walletData ? walletData.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                  </div>
                </InputGroup>
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

        <CardFooter className="flex flex-col space-y-4 px-6 pb-8">
          <div className="relative w-full my-4" role="separator" aria-label="Quick actions">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted-foreground/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-3 text-muted-foreground">Quick Actions</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-12 p-0 flex-col items-center justify-center text-xs"
              onClick={() => router.push("/portfolio")}
            >
              <CreditCard className="h-4 w-4 mb-1" />
              Portfolio
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-12 p-0 flex-col items-center justify-center text-xs"
              onClick={() => router.push("/transactions")}
            >
              <WalletIcon className="h-4 w-4 mb-1" />
              Transactions
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-12 p-0 flex-col items-center justify-center text-xs"
            >
              <Shield className="h-4 w-4 mb-1" />
              Security
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
