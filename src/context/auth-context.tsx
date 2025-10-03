"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "react-hot-toast";

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

  useEffect(() => {
    const checkSession = async () => {
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
        console.error("Error checking session:", error);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);


  const signOut = async () => {
    try {
      await authClient.signOut();
      setSession(null);
      toast.success("You have been signed out successfully.");
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast.error(error.message || "An unexpected error occurred during sign out.");
      // Do not re-throw to prevent UI from breaking, just log and show toast.
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
        loading,
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
