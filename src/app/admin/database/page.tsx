"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Database,
  Server,
  Activity,
  RefreshCw,
  Download,
  Upload,
  Settings,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Zap,
  HardDrive,
  Cpu,
  MemoryStick,
  Wifi,
 WifiOff,
  Globe,
  Shield,
  Key,
  FileText,
  Trash2,
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  Table as TableIcon,
  Columns,
  List,
  KeyRound,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Copy,
  Play,
  Pause,
  SkipForward,
  SkipBack
} from "lucide-react";

interface DatabaseStats {
  totalSize: number;
  totalTables: number;
  totalRows: number;
  activeConnections: number;
  queryPerSecond: number;
  avgQueryTime: number;
  uptime: string;
  lastBackup: string;
}

interface TableInfo {
  name: string;
  rows: number;
  size: string;
  engine: string;
  createdAt: string;
  lastUpdated: string;
}

interface QueryLog {
  id: string;
  query: string;
  duration: number;
  user: string;
  timestamp: string;
  status: "success" | "error" | "slow";
}

export default function AdminDatabasePage() {
  const [dbStats, setDbStats] = useState<DatabaseStats>({
    totalSize: 2.5 * 1024 * 1024 * 1024, // 2.5 GB
    totalTables: 24,
    totalRows: 1250000,
    activeConnections: 45,
    queryPerSecond: 150,
    avgQueryTime: 12,
    uptime: "99.98%",
    lastBackup: "2024-01-15T02:00:00Z"
  });

  const [tables, setTables] = useState<TableInfo[]>([
    {
      name: "users",
      rows: 2847,
      size: "45.2 MB",
      engine: "InnoDB",
      createdAt: "2024-01-01T00:00:00Z",
      lastUpdated: "2024-01-15T12:00:00Z"
    },
    {
      name: "sessions",
      rows: 1234,
      size: "12.1 MB",
      engine: "InnoDB",
      createdAt: "2024-01-01T00:00:00Z",
      lastUpdated: "2024-01-15T12:00:00Z"
    },
    {
      name: "transactions",
      rows: 15678,
      size: "156.7 MB",
      engine: "InnoDB",
      createdAt: "2024-01-01T00:00:00Z",
      lastUpdated: "2024-01-15T12:00:00Z"
    }
  ]);

  const [queryLogs, setQueryLogs] = useState<QueryLog[]>([
    {
      id: "Q001",
      query: "SELECT * FROM users WHERE id = ?",
      duration: 12,
      user: "app_user",
      timestamp: "2024-01-15T12:30:00Z",
      status: "success"
    },
    {
      id: "Q002",
      query: "INSERT INTO transactions (...) VALUES (...)",
      duration: 45,
      user: "app_user",
      timestamp: "2024-01-15T12:29:00Z",
      status: "success"
    },
    {
      id: "Q003",
      query: "SELECT COUNT(*) FROM large_table WHERE status = 'active'",
      duration: 2340,
      user: "app_user",
      timestamp: "2024-01-15T12:28:00Z",
      status: "slow"
    }
  ]);

  const [dbSettings, setDbSettings] = useState({
    enableAutoBackup: true,
    backupFrequency: "daily",
    backupRetention: 30,
    enableQueryCache: true,
    maxConnections: 100,
    connectionTimeout: 30,
    enableSlowQueryLog: true,
    slowQueryThreshold: 1000,
    enablePerformanceMonitoring: true
  });

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Success</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" />Error</Badge>;
      case "slow":
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Slow</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Database</h1>
          <p className="text-muted-foreground">
            Monitor and manage database performance and operations
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Database Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Size</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(dbStats.totalSize)}</div>
            <p className="text-xs text-muted-foreground">
              Total storage used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
            <TableIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dbStats.totalTables}</div>
            <p className="text-xs text-muted-foreground">
              Active tables
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dbStats.activeConnections}</div>
            <p className="text-xs text-muted-foreground">
              Current connections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Query Performance</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dbStats.avgQueryTime}ms</div>
            <p className="text-xs text-muted-foreground">
              Average query time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Database Management */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tables" className="flex items-center gap-2">
            <TableIcon className="h-4 w-4" />
            Tables
          </TabsTrigger>
          <TabsTrigger value="queries" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Queries
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  Current database performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Uptime</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {dbStats.uptime}
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
                      <span className="text-sm text-muted-foreground">Disk Usage</span>
                      <span className="text-sm font-medium">45%</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Queries/sec</span>
                    <span className="text-sm font-medium">{dbStats.queryPerSecond}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Backup Status</CardTitle>
                <CardDescription>
                  Database backup information and schedule
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Backup</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(dbStats.lastBackup).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Next Backup</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Backup Size</span>
                  <span className="text-sm text-muted-foreground">
                    {formatBytes(dbStats.totalSize * 0.3)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto Backup</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable automatic backups
                    </p>
                  </div>
                  <Switch
                    checked={dbSettings.enableAutoBackup}
                    onCheckedChange={(checked) => setDbSettings({
                      ...dbSettings,
                      enableAutoBackup: checked
                    })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Play className="h-4 w-4 mr-2" />
                    Backup Now
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tables */}
        <TabsContent value="tables">
          <Card>
            <CardHeader>
              <CardTitle>Database Tables</CardTitle>
              <CardDescription>
                Overview of all database tables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Table Name</TableHead>
                    <TableHead>Rows</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Engine</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tables.map((table) => (
                    <TableRow key={table.name}>
                      <TableCell className="font-medium">{table.name}</TableCell>
                      <TableCell>{table.rows.toLocaleString()}</TableCell>
                      <TableCell>{table.size}</TableCell>
                      <TableCell>{table.engine}</TableCell>
                      <TableCell>
                        {new Date(table.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(table.lastUpdated).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Queries */}
        <TabsContent value="queries">
          <Card>
            <CardHeader>
              <CardTitle>Query Logs</CardTitle>
              <CardDescription>
                Recent database queries and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Query</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queryLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {log.query.length > 50 ? log.query.substring(0, 50) + "..." : log.query}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={log.duration > 1000 ? "text-red-600" : "text-green-600"}>
                            {log.duration}ms
                          </span>
                          {log.duration > 1000 && <AlertTriangle className="h-3 w-3 text-red-600" />}
                        </div>
                      </TableCell>
                      <TableCell>{log.user}</TableCell>
                      <TableCell>
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Backup Settings</CardTitle>
                <CardDescription>
                  Configure database backup options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Auto Backup</Label>
                    <p className="text-sm text-muted-foreground">
                      Schedule automatic backups
                    </p>
                  </div>
                  <Switch
                    checked={dbSettings.enableAutoBackup}
                    onCheckedChange={(checked) => setDbSettings({
                      ...dbSettings,
                      enableAutoBackup: checked
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Backup Frequency</Label>
                  <Select value={dbSettings.backupFrequency} onValueChange={(value) => setDbSettings({
                    ...dbSettings,
                    backupFrequency: value
                  })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retention">Retention Period (days)</Label>
                  <Input
                    id="retention"
                    type="number"
                    value={dbSettings.backupRetention}
                    onChange={(e) => setDbSettings({
                      ...dbSettings,
                      backupRetention: parseInt(e.target.value)
                    })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Settings</CardTitle>
                <CardDescription>
                  Configure database performance options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Query Cache</Label>
                    <p className="text-sm text-muted-foreground">
                      Cache frequently executed queries
                    </p>
                  </div>
                  <Switch
                    checked={dbSettings.enableQueryCache}
                    onCheckedChange={(checked) => setDbSettings({
                      ...dbSettings,
                      enableQueryCache: checked
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxConnections">Max Connections</Label>
                  <Input
                    id="maxConnections"
                    type="number"
                    value={dbSettings.maxConnections}
                    onChange={(e) => setDbSettings({
                      ...dbSettings,
                      maxConnections: parseInt(e.target.value)
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeout">Connection Timeout (seconds)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={dbSettings.connectionTimeout}
                    onChange={(e) => setDbSettings({
                      ...dbSettings,
                      connectionTimeout: parseInt(e.target.value)
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Slow Query Log</Label>
                    <p className="text-sm text-muted-foreground">
                      Log slow performing queries
                    </p>
                  </div>
                  <Switch
                    checked={dbSettings.enableSlowQueryLog}
                    onCheckedChange={(checked) => setDbSettings({
                      ...dbSettings,
                      enableSlowQueryLog: checked
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slowThreshold">Slow Query Threshold (ms)</Label>
                  <Input
                    id="slowThreshold"
                    type="number"
                    value={dbSettings.slowQueryThreshold}
                    onChange={(e) => setDbSettings({
                      ...dbSettings,
                      slowQueryThreshold: parseInt(e.target.value)
                    })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}