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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Users,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Key,
  Smartphone,
  RefreshCw,
  Ban,
  Settings,
  Unlock,
  UserCheck,
  FileText,
  Download,
  MoreHorizontal,
  ShieldCheck} from "lucide-react";

interface SecurityLog {
  id: string;
  type: "login" | "failed_login" | "password_change" | "2fa_enabled" | "2fa_disabled" | "suspicious_activity" | "account_lockout";
  userId: string;
  userName: string;
  userEmail: string;
  ipAddress: string;
  device: string;
  location: string;
  timestamp: string;
  details: string;
  severity: "low" | "medium" | "high" | "critical";
}

interface BlockedIP {
  id: string;
  ipAddress: string;
  reason: string;
  blockedAt: string;
  expiresAt: string;
  active: boolean;
}

export default function AdminSecurityPage() {
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([
    {
      id: "LOG001",
      type: "login",
      userId: "USR001",
      userName: "John Doe",
      userEmail: "john@example.com",
      ipAddress: "192.168.1.1",
      device: "Chrome on Windows",
      location: "Mumbai, India",
      timestamp: "2024-01-15T10:30:00Z",
      details: "Successful login",
      severity: "low"
    },
    {
      id: "LOG002",
      type: "failed_login",
      userId: "USR002",
      userName: "Jane Smith",
      userEmail: "jane@example.com",
      ipAddress: "192.168.1.2",
      device: "Safari on iPhone",
      location: "Delhi, India",
      timestamp: "2024-01-15T11:15:00Z",
      details: "Invalid password attempt",
      severity: "medium"
    },
    {
      id: "LOG003",
      type: "suspicious_activity",
      userId: "USR003",
      userName: "Mike Johnson",
      userEmail: "mike@example.com",
      ipAddress: "192.168.1.3",
      device: "Firefox on Android",
      location: "Bangalore, India",
      timestamp: "2024-01-15T12:00:00Z",
      details: "Multiple failed login attempts from different locations",
      severity: "high"
    }
  ]);

  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([
    {
      id: "BLOCK001",
      ipAddress: "192.168.1.100",
      reason: "Multiple failed login attempts",
      blockedAt: "2024-01-15T09:00:00Z",
      expiresAt: "2024-01-22T09:00:00Z",
      active: true
    },
    {
      id: "BLOCK002",
      ipAddress: "192.168.1.101",
      reason: "Suspicious activity detected",
      blockedAt: "2024-01-14T14:30:00Z",
      expiresAt: "2024-01-21T14:30:00Z",
      active: true
    }
  ]);

  const [securitySettings, setSecuritySettings] = useState({
    enable2FA: true,
    sessionTimeout: 3600,
    maxLoginAttempts: 5,
    lockoutDuration: 900,
    passwordExpiry: 90,
    requireStrongPassword: true,
    enableIPWhitelisting: false,
    enableSuspiciousActivityDetection: true,
    notifyOnSecurityEvents: true,
    enableAuditLogging: true
  });

  const securityStats = {
    totalLogins: 2847,
    failedLogins: 156,
    activeSessions: 423,
    blockedIPs: blockedIPs.filter(ip => ip.active).length,
    securityAlerts: 23,
    enabled2FA: 1892
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "low":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Low</Badge>;
      case "medium":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Medium</Badge>;
      case "high":
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">High</Badge>;
      case "critical":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Critical</Badge>;
      default:
        return <Badge>{severity}</Badge>;
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case "login":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed_login":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "password_change":
        return <Key className="h-4 w-4 text-blue-600" />;
      case "2fa_enabled":
        return <Smartphone className="h-4 w-4 text-green-600" />;
      case "2fa_disabled":
        return <Smartphone className="h-4 w-4 text-red-600" />;
      case "suspicious_activity":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case "account_lockout":
        return <Ban className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security</h1>
          <p className="text-muted-foreground">
            Monitor and manage platform security settings
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Logs
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Security Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logins</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityStats.totalLogins.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityStats.failedLogins}</div>
            <p className="text-xs text-muted-foreground">
              Failed attempts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityStats.activeSessions}</div>
            <p className="text-xs text-muted-foreground">
              Current sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked IPs</CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityStats.blockedIPs}</div>
            <p className="text-xs text-muted-foreground">
              Currently blocked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityStats.securityAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Pending review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">2FA Enabled</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityStats.enabled2FA}</div>
            <p className="text-xs text-muted-foreground">
              Users protected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Security Settings */}
      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="blocked" className="flex items-center gap-2">
            <Ban className="h-4 w-4" />
            Blocked IPs
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Audit
          </TabsTrigger>
        </TabsList>

        {/* Security Settings */}
        <TabsContent value="settings">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Authentication Settings</CardTitle>
                <CardDescription>
                  Configure authentication and session security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Require 2FA for all admin users
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.enable2FA}
                    onCheckedChange={(checked) => setSecuritySettings({
                      ...securitySettings,
                      enable2FA: checked
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (seconds)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings({
                      ...securitySettings,
                      sessionTimeout: parseInt(e.target.value)
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings({
                      ...securitySettings,
                      maxLoginAttempts: parseInt(e.target.value)
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lockoutDuration">Lockout Duration (seconds)</Label>
                  <Input
                    id="lockoutDuration"
                    type="number"
                    value={securitySettings.lockoutDuration}
                    onChange={(e) => setSecuritySettings({
                      ...securitySettings,
                      lockoutDuration: parseInt(e.target.value)
                    })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Password Policy</CardTitle>
                <CardDescription>
                  Configure password requirements and expiry
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                  <Input
                    id="passwordExpiry"
                    type="number"
                    value={securitySettings.passwordExpiry}
                    onChange={(e) => setSecuritySettings({
                      ...securitySettings,
                      passwordExpiry: parseInt(e.target.value)
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Strong Passwords</Label>
                    <p className="text-sm text-muted-foreground">
                      Enforce password complexity rules
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.requireStrongPassword}
                    onCheckedChange={(checked) => setSecuritySettings({
                      ...securitySettings,
                      requireStrongPassword: checked
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable IP Whitelisting</Label>
                    <p className="text-sm text-muted-foreground">
                      Restrict access to specific IPs
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.enableIPWhitelisting}
                    onCheckedChange={(checked) => setSecuritySettings({
                      ...securitySettings,
                      enableIPWhitelisting: checked
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Suspicious Activity Detection</Label>
                    <p className="text-sm text-muted-foreground">
                      Detect and alert on unusual behavior
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.enableSuspiciousActivityDetection}
                    onCheckedChange={(checked) => setSecuritySettings({
                      ...securitySettings,
                      enableSuspiciousActivityDetection: checked
                    })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Logs */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Security Logs</CardTitle>
              <CardDescription>
                Recent security events and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {securityLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getLogIcon(log.type)}
                          <span className="capitalize">{log.type.replace("_", " ")}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={`/placeholder-avatar.jpg`} alt={log.userName} />
                            <AvatarFallback>{log.userName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{log.userName}</p>
                            <p className="text-xs text-muted-foreground">{log.userEmail}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{log.ipAddress}</TableCell>
                      <TableCell>{log.location}</TableCell>
                      <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(log.timestamp).toLocaleDateString()}
                          <div className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </TableCell>
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

        {/* Blocked IPs */}
        <TabsContent value="blocked">
          <Card>
            <CardHeader>
              <CardTitle>Blocked IP Addresses</CardTitle>
              <CardDescription>
                Currently blocked IP addresses and reasons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Blocked At</TableHead>
                    <TableHead>Expires At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blockedIPs.map((ip) => (
                    <TableRow key={ip.id}>
                      <TableCell className="font-medium">{ip.ipAddress}</TableCell>
                      <TableCell>{ip.reason}</TableCell>
                      <TableCell>
                        {new Date(ip.blockedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(ip.expiresAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={ip.active ? "destructive" : "secondary"}>
                          {ip.active ? "Blocked" : "Expired"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Unlock className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
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

        {/* Audit Trail */}
        <TabsContent value="audit">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Audit Settings</CardTitle>
                <CardDescription>
                  Configure audit logging and monitoring
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Audit Logging</Label>
                    <p className="text-sm text-muted-foreground">
                      Log all administrative actions
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.enableAuditLogging}
                    onCheckedChange={(checked) => setSecuritySettings({
                      ...securitySettings,
                      enableAuditLogging: checked
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Security Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send alerts for security events
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.notifyOnSecurityEvents}
                    onCheckedChange={(checked) => setSecuritySettings({
                      ...securitySettings,
                      notifyOnSecurityEvents: checked
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Audit Log Retention</Label>
                  <Select defaultValue="365">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                      <SelectItem value="1095">3 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Audit Events</CardTitle>
                <CardDescription>
                  Recent administrative actions and changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                      <Settings className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Security settings updated</p>
                      <p className="text-xs text-muted-foreground">Admin User - 2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-100 text-green-600">
                      <UserCheck className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">User role modified</p>
                      <p className="text-xs text-muted-foreground">Admin User - 4 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-red-100 text-red-600">
                      <Ban className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">IP address blocked</p>
                      <p className="text-xs text-muted-foreground">System - 6 hours ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}