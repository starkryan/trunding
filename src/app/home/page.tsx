"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, TrendingUp, Users, DollarSign } from "lucide-react";

export default function HomePage() {
  const { session, loading, signOut } = useAuth();
  const router = useRouter();

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

  return (
    <div className="h-screen w-full bg-background flex flex-col">
      {/* Main content area with padding for mobile tabs */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-6">
          

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$45,231.89</div>
                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$12,234.50</div>
                <p className="text-xs text-muted-foreground">+15.2% from last week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Trades</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+573</div>
                <p className="text-xs text-muted-foreground">+201 since last hour</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Market Cap</CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$1.2T</div>
                <p className="text-xs text-muted-foreground">+2.5% from yesterday</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-16 flex flex-col items-center justify-center"
                onClick={() => router.push("/trade")}
              >
                <TrendingUp className="h-5 w-5 mb-1" />
                <span>Start Trading</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 flex flex-col items-center justify-center"
                onClick={() => router.push("/portfolio")}
              >
                <Home className="h-5 w-5 mb-1" />
                <span>View Portfolio</span>
              </Button>
            </div>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest transactions and trades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">BTC Purchase</p>
                    <p className="text-sm text-muted-foreground">2 hours ago</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">+$1,234.50</p>
                    <p className="text-sm text-muted-foreground">0.05 BTC</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">ETH Sale</p>
                    <p className="text-sm text-muted-foreground">5 hours ago</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-red-600">-$567.80</p>
                    <p className="text-sm text-muted-foreground">2.3 ETH</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">USDT Deposit</p>
                    <p className="text-sm text-muted-foreground">1 day ago</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">+$5,000.00</p>
                    <p className="text-sm text-muted-foreground">5,000 USDT</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
