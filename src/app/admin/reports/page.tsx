"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  Download,
  RefreshCw,
  Plus,
  Search,
  Filter,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Activity,
  Database,
  Mail,
  CreditCard,
  Settings,
  Eye,
  Trash2,
  Copy,
  Share,
  Printer,
  FileSpreadsheet,
  FileImage,
  File,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  BarChart2,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  AreaChart,
  ScatterChart,
  Radar,
  Target,
  Zap,
  Globe,
  Smartphone,
  Tablet,
  Monitor,
  MapPin,
  TrendingUp as TrendUp,
  TrendingDown as TrendDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Shield
} from "lucide-react";

interface Report {
  id: string;
  name: string;
  type: "user" | "financial" | "system" | "security" | "custom";
  description: string;
  createdAt: string;
  lastGenerated: string;
  status: "ready" | "generating" | "failed";
  size: string;
  format: "pdf" | "csv" | "excel" | "json";
  scheduled: boolean;
  schedule?: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  fields: Array<{
    name: string;
    type: "date" | "select" | "text" | "number" | "checkbox";
    label: string;
    required: boolean;
    options?: string[];
  }>;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([
    {
      id: "RPT001",
      name: "Monthly User Report",
      type: "user",
      description: "Comprehensive user analytics and growth metrics",
      createdAt: "2024-01-01T00:00:00Z",
      lastGenerated: "2024-01-15T10:00:00Z",
      status: "ready",
      size: "2.3 MB",
      format: "pdf",
      scheduled: true,
      schedule: "monthly"
    },
    {
      id: "RPT002",
      name: "Financial Summary",
      type: "financial",
      description: "Monthly financial performance and transactions",
      createdAt: "2024-01-01T00:00:00Z",
      lastGenerated: "2024-01-15T10:00:00Z",
      status: "ready",
      size: "1.8 MB",
      format: "excel",
      scheduled: true,
      schedule: "monthly"
    },
    {
      id: "RPT003",
      name: "System Health Check",
      type: "system",
      description: "System performance and health metrics",
      createdAt: "2024-01-01T00:00:00Z",
      lastGenerated: "2024-01-15T10:00:00Z",
      status: "generating",
      size: "0 MB",
      format: "pdf",
      scheduled: false
    }
  ]);

  const [reportTemplates] = useState<ReportTemplate[]>([
    {
      id: "TPL001",
      name: "User Activity Report",
      category: "User Analytics",
      description: "Track user login patterns and activity",
      icon: <Users className="h-5 w-5" />,
      fields: [
        { name: "startDate", type: "date", label: "Start Date", required: true },
        { name: "endDate", type: "date", label: "End Date", required: true },
        { name: "userType", type: "select", label: "User Type", required: false, options: ["All", "Active", "Inactive", "New"] },
        { name: "includeMetrics", type: "checkbox", label: "Include Performance Metrics", required: false }
      ]
    },
    {
      id: "TPL002",
      name: "Financial Performance",
      category: "Financial",
      description: "Revenue and transaction analysis",
      icon: <DollarSign className="h-5 w-5" />,
      fields: [
        { name: "period", type: "select", label: "Period", required: true, options: ["Daily", "Weekly", "Monthly", "Quarterly"] },
        { name: "currency", type: "select", label: "Currency", required: true, options: ["INR", "USD", "EUR"] },
        { name: "includeTransactions", type: "checkbox", label: "Include Transaction Details", required: false }
      ]
    },
    {
      id: "TPL003",
      name: "System Performance",
      category: "System",
      description: "Server and application performance metrics",
      icon: <Activity className="h-5 w-5" />,
      fields: [
        { name: "timeRange", type: "select", label: "Time Range", required: true, options: ["Last 24 hours", "Last 7 days", "Last 30 days"] },
        { name: "metrics", type: "select", label: "Metrics", required: true, options: ["All", "CPU", "Memory", "Disk", "Network"] },
        { name: "threshold", type: "number", label: "Alert Threshold (%)", required: false }
      ]
    },
    {
      id: "TPL004",
      name: "Security Audit",
      category: "Security",
      description: "Security events and access logs",
      icon: <Shield className="h-5 w-5" />,
      fields: [
        { name: "startDate", type: "date", label: "Start Date", required: true },
        { name: "endDate", type: "date", label: "End Date", required: true },
        { name: "eventType", type: "select", label: "Event Type", required: false, options: ["All", "Login", "Failed Login", "Password Change", "2FA"] },
        { name: "includeIPs", type: "checkbox", label: "Include IP Addresses", required: false }
      ]
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || report.type === typeFilter;
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ready":
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Ready</Badge>;
      case "generating":
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Generating</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-700"><AlertTriangle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "pdf":
        return <File className="h-4 w-4 text-red-600" />;
      case "csv":
        return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
      case "excel":
        return <FileSpreadsheet className="h-4 w-4 text-blue-600" />;
      case "json":
        return <File className="h-4 w-4 text-purple-600" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const reportStats = {
    totalReports: reports.length,
    readyReports: reports.filter(r => r.status === "ready").length,
    generatingReports: reports.filter(r => r.status === "generating").length,
    scheduledReports: reports.filter(r => r.scheduled).length,
    totalSize: reports.reduce((sum, r) => sum + parseFloat(r.size), 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate and manage system reports and analytics
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export All
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Report</DialogTitle>
                <DialogDescription>
                  Select a report template to generate a new report
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {reportTemplates.map((template) => (
                    <Card key={template.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            {template.icon}
                          </div>
                          <div>
                            <CardTitle className="text-sm">{template.name}</CardTitle>
                            <CardDescription className="text-xs">{template.category}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                        <div className="mt-3">
                          <Button size="sm" className="w-full">
                            Select Template
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Report Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportStats.totalReports}</div>
            <p className="text-xs text-muted-foreground">
              All reports
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportStats.readyReports}</div>
            <p className="text-xs text-muted-foreground">
              Available for download
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generating</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportStats.generatingReports}</div>
            <p className="text-xs text-muted-foreground">
              Currently generating
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportStats.scheduledReports}</div>
            <p className="text-xs text-muted-foreground">
              Automated reports
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Size</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportStats.totalSize.toFixed(1)} MB</div>
            <p className="text-xs text-muted-foreground">
              Storage used
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Report List */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Reports</CardTitle>
          <CardDescription>
            View and manage all generated reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="security">Security</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="generating">Generating</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Last Generated</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{report.name}</p>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{report.type}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getFormatIcon(report.format)}
                      <span className="uppercase">{report.format}</span>
                    </div>
                  </TableCell>
                  <TableCell>{report.size}</TableCell>
                  <TableCell>
                    {report.lastGenerated && (
                      <div className="text-sm">
                        {new Date(report.lastGenerated).toLocaleDateString()}
                        <div className="text-xs text-muted-foreground">
                          {new Date(report.lastGenerated).toLocaleTimeString()}
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {report.scheduled ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {report.schedule}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">Manual</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {report.status === "ready" && (
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Share className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Report Templates */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common report generation tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Generate Monthly Summary
                </div>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Export User Data
                </div>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Financial Report
                </div>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  System Health Check
                </div>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest report generation activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Monthly User Report generated</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Financial Summary is generating</p>
                  <p className="text-xs text-muted-foreground">5 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                  <Download className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Security Audit downloaded</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}