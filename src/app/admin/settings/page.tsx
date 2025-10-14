"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import PaymentProviderManager from "@/components/admin/payment-providers/payment-provider-manager";
import {
  Settings,
  Bell,
  Shield,
  Database,
  Mail,
  Users,
  Globe,
  Zap,
  Palette,
  Key,
  RefreshCw,
  Save,
  Download,
  Upload,
  Trash2,
  Plus,
  CheckCircle,
  AlertTriangle,
  Clock,
  Server,
  Activity,
  BarChart3,
  User,
  Building2,
  CreditCard,
  FileText,
  HelpCircle,
  Info
} from "lucide-react";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    // Check if tab is specified in URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, []);

  const [settings, setSettings] = useState({
    general: {
      siteName: "Mintward Admin",
      siteUrl: "https://admin.montra.com",
      timeZone: "UTC",
      language: "en",
      maintenanceMode: false
    },
    email: {
      smtpHost: "smtp.resend.com",
      smtpPort: "587",
      smtpUser: "apikey",
      emailFrom: "noreply@montra.com",
      emailNotifications: true
    },
    security: {
      sessionTimeout: "3600",
      maxLoginAttempts: "5",
      passwordMinLength: "8",
      require2FA: false,
      blockSuspiciousIPs: true
    },
    notifications: {
      emailAlerts: true,
      pushNotifications: true,
      adminAlerts: true,
      securityAlerts: true,
      systemAlerts: true
    }
  });

  const handleSave = () => {
    // Save settings logic here
    console.log("Settings saved:", settings);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure platform settings and system preferences
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Config
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Import Config
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="payment-providers" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment Providers
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Site Configuration</CardTitle>
                <CardDescription>
                  Basic site settings and information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.general.siteName}
                    onChange={(e) => setSettings({
                      ...settings,
                      general: { ...settings.general, siteName: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteUrl">Site URL</Label>
                  <Input
                    id="siteUrl"
                    value={settings.general.siteUrl}
                    onChange={(e) => setSettings({
                      ...settings,
                      general: { ...settings.general, siteUrl: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeZone">Time Zone</Label>
                  <Select value={settings.general.timeZone} onValueChange={(value) => setSettings({
                    ...settings,
                    general: { ...settings.general, timeZone: value }
                  })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="EST">EST</SelectItem>
                      <SelectItem value="PST">PST</SelectItem>
                      <SelectItem value="IST">IST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Default Language</Label>
                  <Select value={settings.general.language} onValueChange={(value) => setSettings({
                    ...settings,
                    general: { ...settings.general, language: value }
                  })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>
                  Current system status and maintenance options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Disable public access to the platform
                    </p>
                  </div>
                  <Switch
                    checked={settings.general.maintenanceMode}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      general: { ...settings.general, maintenanceMode: checked }
                    })}
                  />
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">System Status</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Operational
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Database</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Connected
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Email Service</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Last Backup</span>
                    <span className="text-sm text-muted-foreground">2 hours ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>SMTP Configuration</CardTitle>
                <CardDescription>
                  Email server settings for outgoing messages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    value={settings.email.smtpHost}
                    onChange={(e) => setSettings({
                      ...settings,
                      email: { ...settings.email, smtpHost: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    value={settings.email.smtpPort}
                    onChange={(e) => setSettings({
                      ...settings,
                      email: { ...settings.email, smtpPort: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpUser">SMTP Username</Label>
                  <Input
                    id="smtpUser"
                    value={settings.email.smtpUser}
                    onChange={(e) => setSettings({
                      ...settings,
                      email: { ...settings.email, smtpUser: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailFrom">From Email</Label>
                  <Input
                    id="emailFrom"
                    value={settings.email.emailFrom}
                    onChange={(e) => setSettings({
                      ...settings,
                      email: { ...settings.email, emailFrom: e.target.value }
                    })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Email Testing</CardTitle>
                <CardDescription>
                  Test email configuration and templates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable email notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.email.emailNotifications}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      email: { ...settings.email, emailNotifications: checked }
                    })}
                  />
                </div>
                <Separator />
                <div className="space-y-3">
                  <Button variant="outline" className="w-full">
                    <Mail className="mr-2 h-4 w-4" />
                    Send Test Email
                  </Button>
                  <Button variant="outline" className="w-full">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Test Connection
                  </Button>
                </div>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Email Templates</h4>
                  <div className="space-y-1">
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      Welcome Email
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      Password Reset
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      Security Alert
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Authentication Settings</CardTitle>
                <CardDescription>
                  Configure security and authentication options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (seconds)</Label>
                  <Input
                    id="sessionTimeout"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => setSettings({
                      ...settings,
                      security: { ...settings.security, sessionTimeout: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => setSettings({
                      ...settings,
                      security: { ...settings.security, maxLoginAttempts: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                  <Input
                    id="passwordMinLength"
                    value={settings.security.passwordMinLength}
                    onChange={(e) => setSettings({
                      ...settings,
                      security: { ...settings.security, passwordMinLength: e.target.value }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require 2FA</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable two-factor authentication
                    </p>
                  </div>
                  <Switch
                    checked={settings.security.require2FA}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      security: { ...settings.security, require2FA: checked }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Block Suspicious IPs</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically block suspicious activity
                    </p>
                  </div>
                  <Switch
                    checked={settings.security.blockSuspiciousIPs}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      security: { ...settings.security, blockSuspiciousIPs: checked }
                    })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Status</CardTitle>
                <CardDescription>
                  Current security metrics and alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">SSL Certificate</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Valid
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Failed Logins (24h)</span>
                    <span className="text-sm text-muted-foreground">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Blocked IPs</span>
                    <span className="text-sm text-muted-foreground">3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Last Security Scan</span>
                    <span className="text-sm text-muted-foreground">1 hour ago</span>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Quick Actions</h4>
                  <div className="space-y-1">
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      View Security Logs
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      Manage Blocked IPs
                      <Shield className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      Reset All Sessions
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payment Providers Settings */}
        <TabsContent value="payment-providers">
          <PaymentProviderManager />
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.emailAlerts}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, emailAlerts: checked }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.pushNotifications}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, pushNotifications: checked }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Admin Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Important administrative notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.adminAlerts}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, adminAlerts: checked }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Security Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Security-related notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.securityAlerts}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, securityAlerts: checked }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>System Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      System and performance notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.systemAlerts}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, systemAlerts: checked }
                    })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Notifications</CardTitle>
                <CardDescription>
                  View recent system notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className="p-1 rounded-full bg-green-100 text-green-600">
                      <CheckCircle className="h-3 w-3" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">System backup completed</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className="p-1 rounded-full bg-blue-100 text-blue-600">
                      <Users className="h-3 w-3" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">New user registration</p>
                      <p className="text-xs text-muted-foreground">3 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className="p-1 rounded-full bg-yellow-100 text-yellow-600">
                      <AlertTriangle className="h-3 w-3" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">High CPU usage detected</p>
                      <p className="text-xs text-muted-foreground">5 hours ago</p>
                    </div>
                  </div>
                </div>
                <Separator />
                <Button variant="outline" className="w-full">
                  View All Notifications
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}