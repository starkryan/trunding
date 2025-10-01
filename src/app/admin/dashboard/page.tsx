"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import {
  Users,
  TrendingUp,
  DollarSign,
  Shield,
  Activity,
  CreditCard,
  BarChart3,
  UserPlus,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Download,
  Filter,
  RefreshCw,
  MoreHorizontal,
  Bell,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Heart,
  Star,
  Calendar,
  Target,
  Zap,
  Award,
  Building2,
  Globe,
  Server,
  Database,
  Settings,
  HelpCircle
} from "lucide-react";

export default function AdminDashboardPage() {
  // Mock data for demonstration
  const stats = {
    totalUsers: 2847,
    totalInvestments: 12500000,
    activeTrades: 142,
    securityAlerts: 3,
    monthlyGrowth: 23.5,
    dailyActive: 423,
    conversionRate: 12.3,
    avgInvestment: 4390
  };

  const recentActivity = [
    {
      id: 1,
      user: "John Doe",
      action: "Made investment",
      amount: "₹25,000",
      time: "2 minutes ago",
      type: "investment",
      status: "success"
    },
    {
      id: 2,
      user: "Jane Smith",
      action: "Registered account",
      amount: "",
      time: "15 minutes ago",
      type: "registration",
      status: "success"
    },
    {
      id: 3,
      user: "Mike Johnson",
      action: "Withdrawal request",
      amount: "₹10,000",
      time: "1 hour ago",
      type: "withdrawal",
      status: "pending"
    },
    {
      id: 4,
      user: "Sarah Wilson",
      action: "Profile updated",
      amount: "",
      time: "2 hours ago",
      type: "profile",
      status: "success"
    },
    {
      id: 5,
      user: "System",
      action: "Security alert",
      amount: "",
      time: "3 hours ago",
      type: "security",
      status: "warning"
    }
  ];

  const topPerformers = [
    { name: "Tech Growth Fund", value: "₹2.4M", change: "+12.5%" },
    { name: "Green Energy ETF", value: "₹1.8M", change: "+8.3%" },
    { name: "Healthcare Plus", value: "₹1.2M", change: "+5.7%" },
    { name: "Real Estate Trust", value: "₹987K", change: "+3.2%" }
  ];

  const systemHealth = {
    uptime: "99.98%",
    responseTime: "142ms",
    cpuUsage: "67%",
    memoryUsage: "78%",
    diskUsage: "45%"
  };

  // Investment Growth Data
  const investmentData = [
    { month: "Jan", investments: 2400000, users: 1800 },
    { month: "Feb", investments: 2800000, users: 2100 },
    { month: "Mar", investments: 3200000, users: 2400 },
    { month: "Apr", investments: 3800000, users: 2700 },
    { month: "May", investments: 4200000, users: 2900 },
    { month: "Jun", investments: 4800000, users: 3200 },
    { month: "Jul", investments: 5200000, users: 3500 },
    { month: "Aug", investments: 5800000, users: 3800 },
    { month: "Sep", investments: 6200000, users: 4100 },
    { month: "Oct", investments: 6800000, users: 4400 },
    { month: "Nov", investments: 7500000, users: 4700 },
    { month: "Dec", investments: 8200000, users: 5000 }
  ];

  
  // Investment Distribution Data
  const investmentDistribution = [
    { name: "Stocks", value: 45, color: "#8884d8" },
    { name: "Bonds", value: 25, color: "#82ca9d" },
    { name: "Real Estate", value: 15, color: "#ffc658" },
    { name: "Commodities", value: 10, color: "#ff7c7c" },
    { name: "Crypto", value: 5, color: "#8dd1e1" }
  ];

  // Revenue Trend Data
  const revenueData = [
    { month: "Jan", revenue: 2800000, profit: 420000 },
    { month: "Feb", revenue: 3200000, profit: 480000 },
    { month: "Mar", revenue: 3600000, profit: 540000 },
    { month: "Apr", revenue: 4100000, profit: 615000 },
    { month: "May", revenue: 4500000, profit: 675000 },
    { month: "Jun", revenue: 5100000, profit: 765000 },
    { month: "Jul", revenue: 5600000, profit: 840000 },
    { month: "Aug", revenue: 6200000, profit: 930000 },
    { month: "Sep", revenue: 6800000, profit: 1020000 },
    { month: "Oct", revenue: 7400000, profit: 1110000 },
    { month: "Nov", revenue: 8100000, profit: 1215000 },
    { month: "Dec", revenue: 8800000, profit: 1320000 }
  ];

  const chartConfig = {
    investments: {
      label: "Investments",
      color: "#8884d8",
    },
    users: {
      label: "Users",
      color: "#82ca9d",
    },
    revenue: {
      label: "Revenue",
      color: "#ffc658",
    },
    profit: {
      label: "Profit",
      color: "#ff7c7c",
    },
    newUsers: {
      label: "New Users",
      color: "#8dd1e1",
    },
    activeUsers: {
      label: "Active Users",
      color: "#d084d0",
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage your investment platform in real-time
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -mr-10 -mt-10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +{stats.monthlyGrowth}%
              </Badge>
              <p className="text-xs text-muted-foreground">from last month</p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-100 rounded-full -mr-10 -mt-10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(stats.totalInvestments / 1000000).toFixed(1)}M</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +18.2%
              </Badge>
              <p className="text-xs text-muted-foreground">from last month</p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100 rounded-full -mr-10 -mt-10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trades</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTrades}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +5.3%
              </Badge>
              <p className="text-xs text-muted-foreground">from yesterday</p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-100 rounded-full -mr-10 -mt-10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.securityAlerts}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                <AlertTriangle className="h-3 w-3 mr-1" />
                2 new
              </Badge>
              <p className="text-xs text-muted-foreground">needs attention</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Investment Growth Chart */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Investment Growth</CardTitle>
                <CardDescription>Monthly investment trends and user growth</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={investmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `₹${(value / 1000000).toFixed(1)}M`}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Bar
                  dataKey="investments"
                  fill="#8884d8"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="users"
                  fill="#82ca9d"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Investment Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Investment Distribution</CardTitle>
            <CardDescription>Portfolio allocation by asset type</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={investmentDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `${value}%`}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Bar
                  dataKey="value"
                  fill="#8884d8"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {investmentDistribution.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}</span>
                  <span className="text-sm font-medium ml-auto">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Profit Trend</CardTitle>
            <CardDescription>Monthly revenue and profit comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `₹${(value / 1000000).toFixed(1)}M`}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Bar
                  dataKey="revenue"
                  fill="#ffc658"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="profit"
                  fill="#ff7c7c"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Activity */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest platform activities</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Eye className="mr-2 h-4 w-4" />
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      activity.type === 'investment' ? 'bg-green-100 text-green-600' :
                      activity.type === 'registration' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'withdrawal' ? 'bg-yellow-100 text-yellow-600' :
                      activity.type === 'security' ? 'bg-red-100 text-red-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      {activity.type === 'investment' && <CreditCard className="h-4 w-4" />}
                      {activity.type === 'registration' && <UserPlus className="h-4 w-4" />}
                      {activity.type === 'withdrawal' && <TrendingDown className="h-4 w-4" />}
                      {activity.type === 'security' && <Shield className="h-4 w-4" />}
                      {activity.type === 'profile' && <UserPlus className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{activity.user}</p>
                      <p className="text-xs text-muted-foreground">{activity.action}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      {activity.amount && (
                        <span className="text-sm font-medium">{activity.amount}</span>
                      )}
                      <Badge variant={
                        activity.status === 'success' ? 'default' :
                        activity.status === 'warning' ? 'secondary' :
                        activity.status === 'pending' ? 'outline' : 'destructive'
                      } className="text-xs">
                        {activity.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Platform performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Uptime</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {systemHealth.uptime}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">CPU Usage</span>
                  <span className="text-sm font-medium">{systemHealth.cpuUsage}</span>
                </div>
                <Progress value={67} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Memory Usage</span>
                  <span className="text-sm font-medium">{systemHealth.memoryUsage}</span>
                </div>
                <Progress value={78} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Disk Usage</span>
                  <span className="text-sm font-medium">{systemHealth.diskUsage}</span>
                </div>
                <Progress value={45} className="h-2" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Response Time</span>
                <Badge variant="outline">{systemHealth.responseTime}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Active</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dailyActive}</div>
            <p className="text-xs text-muted-foreground">
              +12% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% improvement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Investment</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.avgInvestment.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +8.5% increase
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performers</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topPerformers.slice(0, 2).map((performer, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{performer.name}</span>
                  <Badge variant="outline" className="text-xs">{performer.change}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}