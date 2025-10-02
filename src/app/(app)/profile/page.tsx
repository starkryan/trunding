"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiUser,
  FiMail,
  FiCalendar,
  FiSun,
  FiMoon,
  FiMonitor,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Bell, Shield, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ProfilePage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !session) {
      router.push("/signin");
    }
  }, [session, loading, router]);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/signin");
  };

  // Show loading state while checking authentication
  if (loading || !mounted) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
            <FiUser className="absolute inset-0 m-auto text-primary size-6" />
          </div>
        </div>
      </div>
    );
  }

  // Don't render if user is not authenticated
  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      <Card className="flex-1 w-full rounded-none shadow-none border-0 bg-background sm:rounded-lg sm:shadow-lg sm:border sm:max-w-2xl mx-auto my-8 overflow-y-auto">
       

        <CardContent className="px-6 space-y-6">
          {/* Profile Header */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src={session.user.image || ""} alt={session.user.name} />
                <AvatarFallback className="text-xl">
                  {session.user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{session.user.name}</h3>
              <p className="text-muted-foreground">{session.user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">Active since {new Date(session.user.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</Badge>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
              <div className="relative group">
                <FiUser
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 size-5 pointer-events-none"
                  aria-hidden="true"
                />
                <div className="pl-12 h-12 flex items-center text-base bg-muted/30 rounded-lg border border-muted-foreground/20">
                  {session.user.name}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Email Address</label>
              <div className="relative group">
                <FiMail
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 size-5 pointer-events-none"
                  aria-hidden="true"
                />
                <div className="pl-12 h-12 flex items-center text-base bg-muted/30 rounded-lg border border-muted-foreground/20">
                  {session.user.email}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Theme</label>
              <div className="relative group">
                {theme === 'light' && (
                  <FiSun
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 size-5 pointer-events-none"
                    aria-hidden="true"
                  />
                )}
                {theme === 'dark' && (
                  <FiMoon
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 size-5 pointer-events-none"
                    aria-hidden="true"
                  />
                )}
                {theme === 'system' && (
                  <FiMonitor
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 size-5 pointer-events-none"
                    aria-hidden="true"
                  />
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start h-12 pl-12"
                    >
                      {theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem onClick={() => setTheme('light')} className="flex items-center gap-2">
                      <FiSun size={16} />
                      <span>Light</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('dark')} className="flex items-center gap-2">
                      <FiMoon size={16} />
                      <span>Dark</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('system')} className="flex items-center gap-2">
                      <FiMonitor size={16} />
                      <span>System</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 px-6 pb-8">
          <div className="relative w-full my-4" role="separator" aria-label="Quick actions">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted-foreground/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-3 text-muted-foreground">Quick Actions</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-12 p-0 flex-col items-center justify-center text-xs"
              onClick={() => router.push("/portfolio")}
            >
              <CreditCard className="h-4 w-4 mb-1" />
              Portfolio
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-12 p-0 flex-col items-center justify-center text-xs"
            >
              <Bell className="h-4 w-4 mb-1" />
              Notifications
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-12 p-0 flex-col items-center justify-center text-xs"
            >
              <Shield className="h-4 w-4 mb-1" />
              Security
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
