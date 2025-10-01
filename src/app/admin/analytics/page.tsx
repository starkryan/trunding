"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import {
  Users,
  TrendingUp,
  Activity,
  Database,
  BarChart3,
  PieChart,
  LineChart,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  RefreshCw,
  Filter,
  Target,
  Zap,
  Award,
  Building2,
  Globe,
  Server,
  Shield,
  CheckCircle,
  AlertTriangle,
  TrendingDown,
  UserPlus,
  UserMinus,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  ChevronRight,
  Home,
  Settings,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Heart,
  Star,
  DollarSign,
  CreditCard,
  FileText,
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
  HelpCircle
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalSessions: number;
  totalAccounts: number;
  recentUsers: number;
}

interface UserGrowthData {
  date: string;
  count: number;
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalSessions: 0,
    totalAccounts: 0,
    recentUsers: 0,
  });
  const [userGrowth, setUserGrowth] = useState<UserGrowthData[]>([]);
  const [sessionData, setSessionData] = useState([]);
  const [accountData, setAccountData] = useState([]);
  const [timeRange, setTimeRange] = useState("30d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/stats?timeRange=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setUserGrowth(data.userGrowth);
        setSessionData(data.sessionData || []);
        setAccountData(data.accountData || []);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Platform performance and user engagement metrics
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={fetchStats}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100 rounded-full -mr-10 -mt-10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +{stats.recentUsers}
              </Badge>
              <p className="text-xs text-muted-foreground">this week</p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-100 rounded-full -mr-10 -mt-10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +12%
              </Badge>
              <p className="text-xs text-muted-foreground">from yesterday</p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-100 rounded-full -mr-10 -mt-10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAccounts.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +8%
              </Badge>
              <p className="text-xs text-muted-foreground">linked accounts</p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-orange-100 rounded-full -mr-10 -mt-10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalUsers > 0 ? Math.round((stats.recentUsers / stats.totalUsers) * 100) : 0}%
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +2.3%
              </Badge>
              <p className="text-xs text-muted-foreground">weekly growth</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth Trend</CardTitle>
            <CardDescription>
              Daily user registration trends over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Growth</span>
                <span className="font-medium">
                  +{userGrowth.reduce((acc, curr) => acc + curr.count, 0)} users
                </span>
              </div>
              <div className="space-y-2">
                {userGrowth.slice(-7).map((item, index) => (
                  <div key={item.date} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.date}</span>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={(item.count / Math.max(...userGrowth.map(u => u.count))) * 100}
                        className="w-20 h-2"
                      />
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {item.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Health */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Health</CardTitle>
            <CardDescription>
              Current system status and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Database Status</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">CPU Usage</span>
                    <span className="text-sm font-medium">67%</span>
                  </div>
                  <Progress value={67} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Memory Usage</span>
                    <span className="text-sm font-medium">78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Response Time</span>
                    <span className="text-sm font-medium">142ms</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Uptime</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    99.98%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Top Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Session Analytics</CardTitle>
            <CardDescription>
              Active user sessions breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Average Session</span>
                <span className="text-sm text-muted-foreground">24m 32s</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Peak Hours</span>
                <span className="text-sm text-muted-foreground">2-4 PM</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Bounce Rate</span>
                <span className="text-sm text-muted-foreground">23%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Page Views</span>
                <span className="text-sm text-muted-foreground">1.2M</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Engagement</CardTitle>
            <CardDescription>
              User activity and retention metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Daily Active</span>
                <span className="text-sm text-muted-foreground">89%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Weekly Active</span>
                <span className="text-sm text-muted-foreground">94%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Monthly Active</span>
                <span className="text-sm text-muted-foreground">97%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Retention Rate</span>
                <span className="text-sm text-muted-foreground">85%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Performance</CardTitle>
            <CardDescription>
              Technical performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Response</span>
                <span className="text-sm text-muted-foreground">89ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Error Rate</span>
                <span className="text-sm text-muted-foreground">0.02%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Throughput</span>
                <span className="text-sm text-muted-foreground">1.2K req/s</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Availability</span>
                <span className="text-sm text-muted-foreground">99.99%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}