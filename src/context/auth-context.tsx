"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { handleSocialOAuthCallback } from "@/lib/referral-processor";

interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  role?: string;
  banned?: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Session {
  user: User;
  sessionToken: string;
}

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const checkSession = async () => {
      try {
        if (!mounted) return;

        const result = await authClient.getSession();
        if (result.data?.user) {
          const user = result.data.user;
          const currentSession = {
            user: user,
            sessionToken: result.data.session.token || "",
          };

          // Process referral data for new social OAuth sign-ins
          if (user.email) {
            await handleSocialOAuthCallback(user);
          }

          setSession(currentSession);
        } else {
          setSession(null);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        if (mounted) setSession(null);
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    checkSession();

    // Set up session refresh interval
    const interval = setInterval(() => {
      if (mounted) {
        checkSession();
      }
    }, 5 * 60 * 1000); // Refresh every 5 minutes

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const signOut = async () => {
    try {
      await authClient.signOut();
      setSession(null);
      toast.success("You have been signed out successfully.");
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast.error(error.message || "An unexpected error occurred during sign out.");
    }
  };

  const refreshSession = async () => {
    try {
      const result = await authClient.getSession();
      if (result.data?.user) {
        setSession({
          user: result.data.user,
          sessionToken: result.data.session.token || "",
        });
      } else {
        setSession(null);
      }
    } catch (error) {
      console.error("Error refreshing session:", error);
      setSession(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        loading: loading && !initialized,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
