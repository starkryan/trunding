"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { User, Mail, Phone, MapPin, Calendar, Shield, Bell, CreditCard, LogOut, Edit, Camera, Sun, Moon, Monitor } from "lucide-react";

export default function ProfilePage() {
  const { session, loading, signOut } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    bio: ""
  });

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
      setFormData({
        name: session.user.name,
        email: session.user.email,
        phone: "+1 (555) 123-4567",
        location: "New York, NY",
        bio: "Cryptocurrency enthusiast and trader."
      });
    }
  }, [session]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // In a real app, this would update the user profile
    setIsEditing(false);
    // Show success message
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/signin");
  };

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
          

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Overview */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="text-center">
                  <div className="relative inline-block">
                    <Avatar className="w-24 h-24 mx-auto">
                      <AvatarImage src={session.user.image || ""} alt={session.user.name} />
                      <AvatarFallback className="text-2xl">
                        {session.user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-xl">{session.user.name}</CardTitle>
                  <CardDescription>{session.user.email}</CardDescription>
                  <div className="flex justify-center mt-2">
                    <Badge variant="secondary">Verified Account</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Member since</span>
                    <span className="font-medium">Jan 2024</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Account status</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">2FA</span>
                    <Badge variant="outline" className="text-green-600 border-green-600">Enabled</Badge>
                  </div>
                  
                  <Separator />
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push("/portfolio")}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Portfolio
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <Bell className="h-4 w-4 mr-2" />
                    Notifications
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    Security
                  </Button>
                  
                  <Separator />
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-red-600 hover:text-red-700"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Profile Details */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>Update your personal details and preferences</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {isEditing ? "Cancel" : "Edit"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="personal" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="personal">Personal</TabsTrigger>
                      <TabsTrigger value="security">Security</TabsTrigger>
                      <TabsTrigger value="preferences">Preferences</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="personal" className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) => handleInputChange("name", e.target.value)}
                              disabled={!isEditing}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => handleInputChange("email", e.target.value)}
                              disabled={!isEditing}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                              id="phone"
                              value={formData.phone}
                              onChange={(e) => handleInputChange("phone", e.target.value)}
                              disabled={!isEditing}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="location">Location</Label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                              id="location"
                              value={formData.location}
                              onChange={(e) => handleInputChange("location", e.target.value)}
                              disabled={!isEditing}
                              className="pl-10"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <textarea
                          id="bio"
                          value={formData.bio}
                          onChange={(e) => handleInputChange("bio", e.target.value)}
                          disabled={!isEditing}
                          rows={3}
                          className="w-full p-3 border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                        />
                      </div>
                      
                      {isEditing && (
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setIsEditing(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleSave}>
                            Save Changes
                          </Button>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="security" className="space-y-6">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
                          <CardDescription>Add an extra layer of security to your account</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Shield className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="font-medium">2FA is enabled</p>
                                <p className="text-sm text-muted-foreground">Your account is protected</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              Manage
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Password</CardTitle>
                          <CardDescription>Change your account password</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="current-password">Current Password</Label>
                              <Input id="current-password" type="password" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="new-password">New Password</Label>
                              <Input id="new-password" type="password" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="confirm-password">Confirm New Password</Label>
                              <Input id="confirm-password" type="password" />
                            </div>
                            <Button>Update Password</Button>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="preferences" className="space-y-6">
                      {/* Theme Settings */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Theme</CardTitle>
                          <CardDescription>Choose your preferred theme</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Button
                              variant={theme === "light" ? "default" : "outline"}
                              className="flex flex-col items-center justify-center h-20 space-y-2"
                              onClick={() => setTheme("light")}
                              disabled={!mounted}
                            >
                              <Sun className="h-6 w-6" />
                              <span className="text-sm">Light</span>
                            </Button>
                            
                            <Button
                              variant={theme === "dark" ? "default" : "outline"}
                              className="flex flex-col items-center justify-center h-20 space-y-2"
                              onClick={() => setTheme("dark")}
                              disabled={!mounted}
                            >
                              <Moon className="h-6 w-6" />
                              <span className="text-sm">Dark</span>
                            </Button>
                            
                            <Button
                              variant={theme === "system" ? "default" : "outline"}
                              className="flex flex-col items-center justify-center h-20 space-y-2"
                              onClick={() => setTheme("system")}
                              disabled={!mounted}
                            >
                              <Monitor className="h-6 w-6" />
                              <span className="text-sm">System</span>
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between pt-2">
                            <div>
                              <p className="font-medium">Current Theme</p>
                              <p className="text-sm text-muted-foreground">
                                {mounted && theme ? theme.charAt(0).toUpperCase() + theme.slice(1) : "Loading..."}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {theme === "light" && <Sun className="h-4 w-4" />}
                              {theme === "dark" && <Moon className="h-4 w-4" />}
                              {theme === "system" && <Monitor className="h-4 w-4" />}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Notifications</CardTitle>
                          <CardDescription>Manage your notification preferences</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Email Notifications</p>
                              <p className="text-sm text-muted-foreground">Receive updates via email</p>
                            </div>
                            <Button variant="outline" size="sm">
                              Configure
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Push Notifications</p>
                              <p className="text-sm text-muted-foreground">Get instant alerts</p>
                            </div>
                            <Button variant="outline" size="sm">
                              Configure
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Trading Preferences</CardTitle>
                          <CardDescription>Customize your trading experience</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Default Currency</p>
                              <p className="text-sm text-muted-foreground">USD</p>
                            </div>
                            <Button variant="outline" size="sm">
                              Change
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Risk Level</p>
                              <p className="text-sm text-muted-foreground">Moderate</p>
                            </div>
                            <Button variant="outline" size="sm">
                              Change
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
