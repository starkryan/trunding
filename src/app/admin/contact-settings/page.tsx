"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MessageCircle,
  Settings,
  Phone,
  Mail,
  Globe,
  Palette,
  Move,
  Eye,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  CheckCircle,
  Zap,
  Layout,
  Smartphone,
  Monitor,
  Link,
  User,
  HelpCircle,
  HeadsetIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";

// Import Lucide icons dynamically
import * as Icons from "lucide-react";

interface ContactSettings {
  id: string;
  contactMethod: "TELEGRAM" | "WHATSAPP" | "EMAIL" | "PHONE" | "CUSTOM";
  url: string | null;
  appUrl: string | null;
  contactValue: string | null;
  buttonText: string;
  buttonColor: string;
  buttonSize: "SMALL" | "MEDIUM" | "LARGE";
  positionBottom: string;
  positionRight: string;
  positionBottomMd: string;
  positionRightMd: string;
  iconName: string;
  isEnabled: boolean;
  openInNewTab: boolean;
  customStyles: any;
  createdAt: string;
  updatedAt: string;
}

// Form schema for contact settings
const contactSettingsSchema = z.object({
  contactMethod: z.enum(["TELEGRAM", "WHATSAPP", "EMAIL", "PHONE", "CUSTOM"]),
  url: z.string().url().optional().or(z.literal("")),
  appUrl: z.string().optional().or(z.literal("")),
  contactValue: z.string().optional(),
  buttonText: z.string().min(1).max(50),
  buttonColor: z.string().min(1).max(50),
  buttonSize: z.enum(["SMALL", "MEDIUM", "LARGE"]),
  positionBottom: z.string().min(1),
  positionRight: z.string().min(1),
  positionBottomMd: z.string().min(1),
  positionRightMd: z.string().min(1),
  iconName: z.string().min(1).max(50),
  isEnabled: z.boolean(),
  openInNewTab: z.boolean(),
  customStyles: z.any().optional(),
});

type ContactSettingsFormData = z.infer<typeof contactSettingsSchema>;

// Available Lucide icons for selection
const availableIcons = [
  "MessageCircle", "HeadsetIcon", "Phone", "Mail", "HelpCircle", 
  "MessageSquare", "Send", "Share", "Link", "User", "Users",
  "Globe", "Smartphone", "Monitor", "Layout", "Settings", "Zap"
];

export default function ContactSettingsPage() {
  const [settings, setSettings] = useState<ContactSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [testConfig, setTestConfig] = useState<ContactSettings | null>(null);

  // Initialize form with react-hook-form and Zod validation
  const form = useForm<ContactSettingsFormData>({
    resolver: zodResolver(contactSettingsSchema),
    defaultValues: {
      contactMethod: "TELEGRAM",
      url: "https://t.me/mintward_support",
      appUrl: "tg://resolve?domain=mintward_support",
      contactValue: "",
      buttonText: "Help & Support",
      buttonColor: "primary",
      buttonSize: "MEDIUM",
      positionBottom: "bottom-24",
      positionRight: "right-4",
      positionBottomMd: "bottom-20",
      positionRightMd: "right-6",
      iconName: "HeadsetIcon",
      isEnabled: true,
      openInNewTab: true,
    },
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/contact-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        form.reset(data.settings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      setError('Failed to load contact settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (data: ContactSettingsFormData) => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch('/api/admin/contact-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const updatedSettings = await response.json();
        setSettings(updatedSettings.settings);
        setSuccessMessage('Contact settings updated successfully!');

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      setError('Network error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleTestSettings = async () => {
    try {
      setError(null);
      const testData = form.getValues();
      
      const response = await fetch('/api/admin/contact-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });

      if (response.ok) {
        const data = await response.json();
        setTestConfig(data.testConfig);
        setShowPreview(true);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to test settings');
      }
    } catch (error) {
      console.error('Failed to test settings:', error);
      setError('Network error occurred');
    }
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.HelpCircle;
    return IconComponent;
  };

  const getContactIcon = (method: string) => {
    switch (method) {
      case 'TELEGRAM': return Icons.MessageCircle;
      case 'WHATSAPP': return Icons.MessageSquare;
      case 'EMAIL': return Icons.Mail;
      case 'PHONE': return Icons.Phone;
      default: return Icons.Link;
    }
  };

  const getContactPlaceholder = (method: string) => {
    switch (method) {
      case 'TELEGRAM': return 'mintward_support';
      case 'WHATSAPP': return '+1234567890';
      case 'EMAIL': return 'support@example.com';
      case 'PHONE': return '+1234567890';
      default: return '';
    }
  };

  const getContactLabel = (method: string) => {
    switch (method) {
      case 'TELEGRAM': return 'Telegram Username';
      case 'WHATSAPP': return 'WhatsApp Number';
      case 'EMAIL': return 'Email Address';
      case 'PHONE': return 'Phone Number';
      default: return 'Contact Value';
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'SMALL': return 'h-10 w-10';
      case 'MEDIUM': return 'h-14 w-14';
      case 'LARGE': return 'h-16 w-16';
      default: return 'h-14 w-14';
    }
  };

  // Preview button component
  const PreviewButton = ({ config, position = "fixed" }: { config: ContactSettings; position?: string }) => {
    if (!config?.isEnabled) return null;
    
    const IconComponent = getIconComponent(config.iconName);
    const sizeClasses = getSizeClasses(config.buttonSize);
    
    return (
      <div className={cn(
        position === "absolute"
          ? `${config.positionBottom} ${config.positionRight} z-40 md:${config.positionBottomMd} md:${config.positionRightMd}`
          : "bottom-4 right-4 z-40"
      )}>
        <Button
          size="lg"
          className={cn(
            sizeClasses,
            "rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 bg-primary hover:bg-primary/90 text-primary-foreground border-2 border-primary/20 relative group"
          )}
        >
          <IconComponent className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />

          {/* Pulse Animation */}
          <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></span>

          {/* Notification Dot */}
          <span className="absolute top-1 right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background animate-pulse"></span>
        </Button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <MessageCircle className="h-8 w-8 text-primary" />
              Contact Settings
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configure floating contact button settings
            </p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <MessageCircle className="h-8 w-8 text-primary" />
            Contact Settings
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configure floating contact button settings and appearance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={settings?.isEnabled ? "default" : "secondary"} className="flex items-center gap-2">
            {settings?.isEnabled ? (
              <>
                <ToggleRight className="h-4 w-4" />
                Active
              </>
            ) : (
              <>
                <ToggleLeft className="h-4 w-4" />
                Inactive
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Success</span>
          </div>
          <p className="text-sm text-green-700 mt-1">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Error</span>
          </div>
          <p className="text-sm text-destructive/90 mt-1">{error}</p>
        </div>
      )}

      {/* Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Contact Button Configuration
          </CardTitle>
          <CardDescription>
            Customize the floating contact button appearance and behavior
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveSettings)} className="space-y-6">
              {/* Enable/Disable Toggle */}
              <div className="flex items-center justify-between space-y-0">
                <div className="space-y-0.5">
                  <FormLabel className="flex items-center gap-2">
                    {form.watch("isEnabled") ? (
                      <ToggleRight className="h-4 w-4 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 text-gray-500" />
                    )}
                    Enable Contact Button
                  </FormLabel>
                  <FormDescription>
                    Show or hide the floating contact button on all pages
                  </FormDescription>
                </div>
                <FormField
                  control={form.control}
                  name="isEnabled"
                  render={({ field }) => (
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  )}
                />
              </div>

              <Separator />

              {/* Contact Method */}
              <FormField
                control={form.control}
                name="contactMethod"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Contact Method
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="TELEGRAM">Telegram</SelectItem>
                        <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                        <SelectItem value="EMAIL">Email</SelectItem>
                        <SelectItem value="PHONE">Phone</SelectItem>
                        <SelectItem value="CUSTOM">Custom URL</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose the contact method for the button
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Conditional fields based on contact method */}
              {form.watch("contactMethod") === "CUSTOM" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Custom URL
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://example.com/contact"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          URL to open when button is clicked
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {(form.watch("contactMethod") === "TELEGRAM" || 
                form.watch("contactMethod") === "WHATSAPP" || 
                form.watch("contactMethod") === "EMAIL" || 
                form.watch("contactMethod") === "PHONE") && (
                <FormField
                  control={form.control}
                  name="contactValue"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="flex items-center gap-2">
                        {(() => {
                          const Icon = getContactIcon(form.watch("contactMethod"));
                          return <Icon className="h-4 w-4" />;
                        })()}
                        {getContactLabel(form.watch("contactMethod"))}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={getContactPlaceholder(form.watch("contactMethod"))}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Contact details for the selected method
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Separator />

              {/* Button Appearance */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Button Appearance
                </h3>

                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="buttonText"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Button Text (Tooltip)</FormLabel>
                        <FormControl>
                          <Input placeholder="Help & Support" {...field} />
                        </FormControl>
                        <FormDescription>
                          Text shown on hover
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="buttonColor"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Button Color</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="primary">Primary</SelectItem>
                            <SelectItem value="secondary">Secondary</SelectItem>
                            <SelectItem value="destructive">Destructive</SelectItem>
                            <SelectItem value="outline">Outline</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="buttonSize"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Button Size</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SMALL">Small</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="LARGE">Large</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Icon Selection */}
                <FormField
                  control={form.control}
                  name="iconName"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="flex items-center gap-2">
                        <HeadsetIcon className="h-4 w-4" />
                        Button Icon
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableIcons.map((icon) => (
                            <SelectItem key={icon} value={icon}>
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const IconComponent = getIconComponent(icon);
                                  return <IconComponent className="h-4 w-4" />;
                                })()}
                                {icon}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose an icon for the button
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Position Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Move className="h-5 w-5" />
                  Position Settings
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Mobile Position
                    </Label>
                    <div className="grid gap-2 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="positionBottom"
                        render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="bottom-4">Bottom 4</SelectItem>
                                <SelectItem value="bottom-8">Bottom 8</SelectItem>
                                <SelectItem value="bottom-12">Bottom 12</SelectItem>
                                <SelectItem value="bottom-16">Bottom 16</SelectItem>
                                <SelectItem value="bottom-20">Bottom 20</SelectItem>
                                <SelectItem value="bottom-24">Bottom 24</SelectItem>
                                <SelectItem value="bottom-28">Bottom 28</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="positionRight"
                        render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="right-4">Right 4</SelectItem>
                                <SelectItem value="right-6">Right 6</SelectItem>
                                <SelectItem value="right-8">Right 8</SelectItem>
                                <SelectItem value="right-12">Right 12</SelectItem>
                                <SelectItem value="right-16">Right 16</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Desktop Position
                    </Label>
                    <div className="grid gap-2 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="positionBottomMd"
                        render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="bottom-4">Bottom 4</SelectItem>
                                <SelectItem value="bottom-8">Bottom 8</SelectItem>
                                <SelectItem value="bottom-12">Bottom 12</SelectItem>
                                <SelectItem value="bottom-16">Bottom 16</SelectItem>
                                <SelectItem value="bottom-20">Bottom 20</SelectItem>
                                <SelectItem value="bottom-24">Bottom 24</SelectItem>
                                <SelectItem value="bottom-28">Bottom 28</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="positionRightMd"
                        render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="right-4">Right 4</SelectItem>
                                <SelectItem value="right-6">Right 6</SelectItem>
                                <SelectItem value="right-8">Right 8</SelectItem>
                                <SelectItem value="right-12">Right 12</SelectItem>
                                <SelectItem value="right-16">Right 16</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Behavior Settings */}
              <div className="flex items-center justify-between space-y-0">
                <div className="space-y-0.5">
                  <FormLabel>Open in New Tab</FormLabel>
                  <FormDescription>
                    Open contact link in a new browser tab
                  </FormDescription>
                </div>
                <FormField
                  control={form.control}
                  name="openInNewTab"
                  render={({ field }) => (
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleTestSettings}>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Settings className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Save Settings
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Contact Button Preview
            </DialogTitle>
            <DialogDescription>
              This is how your contact button will appear on the website
            </DialogDescription>
          </DialogHeader>
          <div className="relative h-64 bg-muted rounded-lg overflow-hidden">
            {/* Simulated website background */}
            <div className="absolute inset-0 bg-gradient-to-br from-background to-muted/20">
              <div className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-muted rounded w-2/3 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
            {/* Preview Button */}
            {testConfig && (
              <PreviewButton config={testConfig} position="absolute" />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}