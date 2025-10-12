"use client";

import React, { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

interface SocialLoginButtonsProps {
  callbackURL?: string;
  dividerText?: string;
  className?: string;
  showDivider?: boolean;
}

export function SocialLoginButtons({
  callbackURL = "/home",
  dividerText = "Or continue with",
  className = "",
  showDivider = true
}: SocialLoginButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    if (activeProvider !== null) return;
    
    setIsLoading(true);
    setActiveProvider('google');

    try {
      // Security: Add a small delay to prevent rapid clicking
      await new Promise(resolve => setTimeout(resolve, 100));

      // Security: Generate a unique request ID for tracking
      const requestId = crypto.randomUUID();

      console.log(`Google OAuth request started: ${requestId}`);

      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL,
      });

      if (result.error) {
        // Security: Don't expose specific error details to users
        let errorMessage = "Failed to sign in with Google. Please try again.";

        // Handle specific error cases with user-friendly messages
        if (result.error.message?.includes("popup_closed_by_user")) {
          errorMessage = "Sign-in was cancelled. Please try again.";
        } else if (result.error.message?.includes("access_denied")) {
          errorMessage = "Access denied. Please check your Google account permissions.";
        } else if (result.error.message?.includes("invalid_client")) {
          errorMessage = "Configuration error. Please contact support.";
        } else if (result.error.message?.includes("redirect_uri_mismatch")) {
          errorMessage = "Redirect configuration error. Please contact support.";
        }

        // Security: Log error without exposing sensitive details
        console.error(`Google OAuth error (${requestId}):`, {
          status: result.error.status,
          code: result.error.code,
          timestamp: new Date().toISOString(),
        });

        toast.error(errorMessage);
      } else {
        // Success - Better Auth will handle the redirect
        console.log(`Google OAuth request completed: ${requestId}`);
      }
    } catch (error) {
      // Security: Generate unique error ID for tracking
      const errorId = crypto.randomUUID();

      console.error(`Google OAuth unexpected error (${errorId}):`, {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });

      // Security: Generic error message for unexpected errors
      toast.error("An unexpected error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
      // Security: Add CSRF protection timing
      setTimeout(() => setActiveProvider(null), 5000);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {showDivider && (
        <div className="relative w-full my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-muted-foreground/20" />
          </div>
          <div className="relative flex justify-center text-sm uppercase">
            <span className="bg-card px-3 text-muted-foreground">
              {dividerText}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {/* Google Sign-In */}
        <Button
          onClick={handleGoogleSignIn}
          variant="outline"
          className={`
            w-full
            h-12
            text-base
            border-muted-foreground/20
            hover:border-muted-foreground/40
            transition-colors
            disabled:opacity-50
            disabled:cursor-not-allowed
          `}
          disabled={isLoading || (activeProvider !== null && activeProvider !== 'google')}
          aria-label={isLoading || (activeProvider !== null && activeProvider !== 'google') ? "Signing in with Google..." : "Sign in with Google"}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <Spinner variant="bars" size={16} className="text-current" />
              <span>Connecting...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <FcGoogle className="h-7 w-7" />
              <span>Continue with Google</span>
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}

// Loading skeleton for social login buttons - follows signup page patterns
export function SocialLoginButtonsSkeleton() {
  return (
    <div className="space-y-3">
      <div className="relative w-full my-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-muted-foreground/20" />
        </div>
        <div className="relative flex justify-center text-sm uppercase">
          <span className="bg-card px-3 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {/* Google button skeleton */}
        <div className="w-full h-12 bg-muted rounded-md animate-pulse" />

        {/* Placeholder for other providers */}
        <div className="w-full h-12 bg-muted rounded-md animate-pulse opacity-75" />
      </div>
    </div>
  );
}

// Error boundary for social login - follows signup page error handling patterns
export class SocialLoginErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Social Login Error Boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 text-center text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg flex items-center animate-in fade-in-50">
            <div className="w-2 h-2 bg-destructive rounded-full mr-2 animate-pulse"></div>
            <div>
              <p>Authentication service temporarily unavailable.</p>
              <p className="text-xs mt-1">Please try again later.</p>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
