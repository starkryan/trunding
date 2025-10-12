"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Gift,
  Users,
  Share2,
  Copy,
  CheckCircle,
  Clock,
  DollarSign,
  Target,
  Calendar,
  Star,
  Award,
  UserPlus,
  Zap,
  Eye,
  MessageCircle,
  Mail,
  Facebook,
  Twitter,
  MessageSquare,
  ArrowRight
} from "lucide-react";

interface ReferralData {
  referralCode: {
    code: string;
    isActive: boolean;
    expiresAt: string | null;
  };
  stats: {
    totalReferrals: number;
    completedReferrals: number;
    pendingReferrals: number;
    totalEarnings: number;
  };
  recentReferrals: Array<{
    id: string;
    status: string;
    createdAt: string;
    completedAt: string | null;
    referredUser: {
      id: string;
      name: string | null;
      email: string;
      createdAt: string;
    };
    payouts: Array<{
      amount: number;
      type: string;
      status: string;
      processedAt: string | null;
    }>;
  }>;
}

export default function ReferralPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loadingReferral, setLoadingReferral] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !session) {
      router.push("/signin");
    }
  }, [session, loading, router]);

  useEffect(() => {
    if (session) {
      loadReferralData();
    }
  }, [session]);

  const loadReferralData = async () => {
    try {
      setLoadingReferral(true);
      const response = await fetch('/api/referral/code');
      if (response.ok) {
        const data = await response.json();
        setReferralData(data);
      }
    } catch (error) {
      console.error("Error loading referral data:", error);
    } finally {
      setLoadingReferral(false);
    }
  };

  const copyReferralCode = () => {
    if (referralData?.referralCode.code) {
      navigator.clipboard.writeText(referralData.referralCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareReferralLink = () => {
    if (referralData?.referralCode.code) {
      const referralUrl = `${window.location.origin}/signup?ref=${referralData.referralCode.code}`;

      if (navigator.share) {
        navigator.share({
          title: "Join Montra Investment Platform",
          text: `Join me on Montra and start investing! Use my referral code: ${referralData.referralCode.code}`,
          url: referralUrl,
        });
      } else {
        navigator.clipboard.writeText(referralUrl);
      }
    }
  };

  const generateReferralCode = async () => {
    try {
      const response = await fetch('/api/referral/code', {
        method: 'POST'
      });

      if (response.ok) {
        await loadReferralData();
      }
    } catch (error) {
      console.error("Error generating referral code:", error);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: "secondary",
      COMPLETED: "default",
      CANCELLED: "destructive",
      EXPIRED: "outline"
    } as const;

    const icons = {
      PENDING: Clock,
      COMPLETED: CheckCircle,
      CANCELLED: Eye,
      EXPIRED: Eye
    };

    const Icon = icons[status as keyof typeof icons];

    return (
      <Badge variant={variants[status as keyof typeof variants]} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  // Show loading state while checking authentication
  if (loading || !mounted) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-6">
          <Spinner variant="bars" size={32} className="text-primary" />
        </div>
      </div>
    );
  }

  // Don't render if user is not authenticated
  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-4 flex items-center justify-center gap-3">
          <Gift className="h-10 w-10 text-primary" />
          Referral Program
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Invite your friends to join Montra and earn rewards when they make their first investment.
        </p>
      </div>

      {loadingReferral ? (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : referralData ? (
        <div className="space-y-8">
          {/* Stats Overview */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{referralData.stats.totalReferrals}</div>
                <p className="text-xs text-muted-foreground">
                  {referralData.stats.completedReferrals} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(referralData.stats.totalEarnings)}</div>
                <p className="text-xs text-muted-foreground">
                  From successful referrals
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Referral Code</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{referralData.referralCode.code}</div>
                <div className="flex items-center gap-1 mt-1">
                  {referralData.referralCode.isActive ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <Clock className="h-3 w-3 text-yellow-500" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {referralData.referralCode.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {referralData.stats.totalReferrals > 0
                    ? Math.round((referralData.stats.completedReferrals / referralData.stats.totalReferrals) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Success rate
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="share" className="space-y-6">
            <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-full">
              <TabsTrigger value="share" className="gap-2">
                <Share2 className="h-4 w-4" />
                Share & Earn
              </TabsTrigger>
              <TabsTrigger value="referrals" className="gap-2">
                <Users className="h-4 w-4" />
                My Referrals
              </TabsTrigger>
              <TabsTrigger value="how-it-works" className="gap-2">
                <Zap className="h-4 w-4" />
                How It Works
              </TabsTrigger>
            </TabsList>

            {/* Share & Earn Tab */}
            <TabsContent value="share">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Referral Code Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="h-5 w-5" />
                      Your Referral Code
                    </CardTitle>
                    <CardDescription>
                      Share this unique code with your friends to earn rewards
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Referral Code</p>
                          <p className="text-2xl font-bold font-mono">{referralData.referralCode.code}</p>
                          {referralData.referralCode.expiresAt && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Expires: {formatDate(referralData.referralCode.expiresAt)}
                            </p>
                          )}
                        </div>
                        <Button
                          variant={copied ? "default" : "outline"}
                          size="sm"
                          onClick={copyReferralCode}
                          className="flex items-center gap-2"
                        >
                          {copied ? (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={shareReferralLink} className="flex-1">
                        <Share2 className="mr-2 h-4 w-4" />
                        Share Link
                      </Button>
                      <Button variant="outline" onClick={generateReferralCode}>
                        <Award className="mr-2 h-4 w-4" />
                        New Code
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Share Options */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Share2 className="h-5 w-5" />
                      Share Via
                    </CardTitle>
                    <CardDescription>
                      Choose your preferred sharing method
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => {
                          const url = `https://wa.me/?text=${encodeURIComponent(`Join me on Montra Investment Platform! Use my referral code: ${referralData.referralCode.code}. Sign up: ${window.location.origin}/signup?ref=${referralData.referralCode.code}`)}`;
                          window.open(url, '_blank');
                        }}
                      >
                        <MessageSquare className="h-4 w-4 text-green-600" />
                        WhatsApp
                      </Button>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => {
                          const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Join me on Montra Investment Platform! Use my referral code: ${referralData.referralCode.code}`)}&url=${encodeURIComponent(`${window.location.origin}/signup?ref=${referralData.referralCode.code}`)}`;
                          window.open(url, '_blank');
                        }}
                      >
                        <Twitter className="h-4 w-4 text-blue-400" />
                        Twitter
                      </Button>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => {
                          const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/signup?ref=${referralData.referralCode.code}`)}`;
                          window.open(url, '_blank');
                        }}
                      >
                        <Facebook className="h-4 w-4 text-blue-600" />
                        Facebook
                      </Button>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => {
                          window.open(`mailto:?subject=${encodeURIComponent('Join me on Montra Investment Platform!')}&body=${encodeURIComponent(`Hi there!\n\nI've been using Montra Investment Platform and thought you might be interested. It's a great platform for growing your investments.\n\nUse my referral code: ${referralData.referralCode.code}\n\nSign up here: ${window.location.origin}/signup?ref=${referralData.referralCode.code}\n\nBest regards`)}`, '_blank');
                        }}
                      >
                        <Mail className="h-4 w-4" />
                        Email
                      </Button>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Share Message
                      </h4>
                      <div className="p-3 bg-muted rounded-lg text-sm">
                        <p className="font-medium mb-1">Join me on Montra Investment Platform!</p>
                        <p className="text-muted-foreground">
                          I've been using Montra and it's been great for growing my investments.
                          Use my referral code <strong>{referralData.referralCode.code}</strong> when you sign up.
                        </p>
                        <p className="text-muted-foreground mt-2">
                          Sign up: {window.location.origin}/signup?ref={referralData.referralCode.code}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Rewards Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Rewards Structure
                  </CardTitle>
                  <CardDescription>
                    Earn rewards when your friends make their first investment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <UserPlus className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">You Earn</p>
                        <p className="text-sm text-muted-foreground">Reward for successful referral</p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="font-bold text-green-600">₹50</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Gift className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Friend Gets</p>
                        <p className="text-sm text-muted-foreground">Welcome bonus on signup</p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="font-bold text-blue-600">₹25</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* My Referrals Tab */}
            <TabsContent value="referrals">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Referral History
                  </CardTitle>
                  <CardDescription>
                    Track your referrals and their status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {referralData.recentReferrals.length > 0 ? (
                    <div className="space-y-4">
                      {referralData.recentReferrals.map((referral) => (
                        <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-lg">
                              <UserPlus className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium">{referral.referredUser.name || referral.referredUser.email}</p>
                              <p className="text-sm text-muted-foreground">{referral.referredUser.email}</p>
                              <p className="text-xs text-muted-foreground">Joined: {formatDate(referral.referredUser.createdAt)}</p>
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            {getStatusBadge(referral.status)}
                            {referral.completedAt && (
                              <p className="text-xs text-muted-foreground">Completed: {formatDate(referral.completedAt)}</p>
                            )}
                            {referral.payouts.length > 0 && (
                              <div className="text-xs">
                                <p className="font-medium text-green-600">
                                  {formatCurrency(referral.payouts.reduce((sum, payout) => sum + payout.amount, 0))}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Referrals Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start sharing your referral code to earn rewards!
                      </p>
                      <Button onClick={() => router.push('/referral')}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share Your Code
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* How It Works Tab */}
            <TabsContent value="how-it-works">
              <div className="grid gap-6 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground mb-4">
                      <span className="text-xl font-bold">1</span>
                    </div>
                    <CardTitle className="text-center">Share Your Code</CardTitle>
                    <CardDescription className="text-center">
                      Share your unique referral code with friends and family
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground mb-4">
                      <span className="text-xl font-bold">2</span>
                    </div>
                    <CardTitle className="text-center">Friend Signs Up</CardTitle>
                    <CardDescription className="text-center">
                      Your friend uses your code to create an account and complete verification
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground mb-4">
                      <span className="text-xl font-bold">3</span>
                    </div>
                    <CardTitle className="text-center">Both Earn Rewards</CardTitle>
                    <CardDescription className="text-center">
                      When your friend makes their first investment, both of you earn rewards
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Program Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Earn for Every Referral</p>
                        <p className="text-sm text-muted-foreground">Get rewarded when friends sign up and invest</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Track Your Progress</p>
                        <p className="text-sm text-muted-foreground">Monitor referral status and earnings</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Multiple Sharing Options</p>
                        <p className="text-sm text-muted-foreground">Share via WhatsApp, email, social media</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Instant Rewards</p>
                        <p className="text-sm text-muted-foreground">Get rewarded as soon as conditions are met</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Gift className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Unable to Load Referral Data</h3>
            <p className="text-muted-foreground mb-4">
              Please try again or contact support if the problem persists.
            </p>
            <Button onClick={loadReferralData}>
              <ArrowRight className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}