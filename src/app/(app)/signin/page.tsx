"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiLogIn } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { toast } from "react-hot-toast";
import { Spinner } from "@/components/ui/spinner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/context/auth-context";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import Link from "next/link";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(1, {
    message: "Password is required.",
  }),
});

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { session, loading, refreshSession } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Redirect authenticated users to home
  useEffect(() => {
    if (!loading && session) {
      router.push("/home");
    }
  }, [session, loading, router]);

  const handleSignInError = async (ctx: any, email: string) => {
    // Handle email verification error (403 status)
    if (ctx.error.status === 403) {
      setError("Please verify your email address before signing in.");
      
      try {
        const otpResult = await authClient.emailOtp.sendVerificationOtp({
          email,
          type: "email-verification",
        });
        
        if (otpResult.data) {
          sessionStorage.setItem("verificationData", JSON.stringify({
            email,
            type: "email-verification"
          }));
          toast("Verification code sent to your email.");
          router.push("/verify-otp");
        }
      } catch {
        toast.error("Failed to send verification email. Try again.");
      }
      return;
    }
    
    setError(ctx.error.message || "Sign in failed. Please check your credentials.");
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: signInError } = await authClient.signIn.email(
        {
          email: values.email,
          password: values.password,
          callbackURL: "/home",
        },
        {
          onSuccess: async () => {
            toast.success("Welcome back!");
            await refreshSession();
            router.push("/home");
          },
          onError: (ctx) => handleSignInError(ctx, values.email),
        }
      );
      
      if (signInError) {
        setError(signInError.message || "Sign in failed. Please check your credentials.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordClick = () => {
    router.push("/forgot-password");
  };

  const handleCreateAccountClick = () => {
    router.push("/signup");
  };

  const clearError = () => {
    setError(null);
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
            <FiLogIn className="absolute inset-0 m-auto text-primary size-6" />
          </div>
        </div>
      </div>
    );
  }

  // Don't render the form if user is authenticated
  if (session) {
    return null;
  }

  return (
    <div className="h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      <Card className="flex-1 w-full rounded-none shadow-none border-0 bg-background sm:rounded-lg sm:shadow-lg sm:border sm:max-w-md mx-auto my-8">
        <CardHeader className="space-y-4 px-6 pt-8 text-center flex-shrink-0">
          <div className="relative mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
              <FiLogIn className="text-white size-7" />
            </div>
            <div className="absolute -inset-1 bg-primary/20 rounded-2xl blur-sm -z-10"></div>
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text text-transparent">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Sign in to continue your journey
            </CardDescription>
          </div>
        </CardHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col">
            <CardContent className="px-6 flex-1 flex flex-col justify-center space-y-4">
              {error && (
                <div 
                  className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg flex items-center animate-in fade-in-50"
                  role="alert"
                  aria-live="assertive"
                >
                  <div className="w-2 h-2 bg-destructive rounded-full mr-2 animate-pulse flex-shrink-0" aria-hidden="true"></div>
                  <span className="flex-1">{error}</span>
                </div>
              )}

              <div role="group" aria-label="Social login options">
                <SocialLoginButtons
                  callbackURL="/home"
                  dividerText="Or continue with email"
                  showDivider={false}
                />
              </div>

              <div className="relative w-full my-4" role="separator" aria-label="or">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-muted-foreground/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-background px-3 text-muted-foreground">or</span>
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel 
                      className="text-base font-medium"
                      htmlFor="email-input"
                    >
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <FiMail 
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/70 group-focus-within:text-primary transition-colors size-5 pointer-events-none" 
                          aria-hidden="true"
                        />
                        <Input
                          id="email-input"
                          type="email"
                          placeholder="Enter your email"
                          autoComplete="email"
                          className="pl-12 h-12 text-base transition-all duration-200 border-muted-foreground/20 focus:border-primary/50 group-hover:border-muted-foreground/30"
                          aria-describedby="email-description email-error"
                          aria-invalid={!!form.formState.errors.email}
                          {...field}
                          onFocus={clearError}
                        />
                      </div>
                    </FormControl>
                    <span id="email-description" className="sr-only">
                      Enter your email address to sign in to your account
                    </span>
                    <FormMessage 
                      className="text-sm animate-in fade-in-50"
                      id="email-error"
                    />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel 
                      className="text-base font-medium"
                      htmlFor="password-input"
                    >
                      Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <FiLock 
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/70 group-focus-within:text-primary transition-colors size-5 pointer-events-none" 
                          aria-hidden="true"
                        />
                        <Input
                          id="password-input"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          className="pl-12 pr-12 h-12 text-base transition-all duration-200 border-muted-foreground/20 focus:border-primary/50 group-hover:border-muted-foreground/30"
                          aria-describedby="password-description password-error"
                          aria-invalid={!!form.formState.errors.password}
                          {...field}
                          onFocus={clearError}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          aria-pressed={showPassword}
                          tabIndex={0}
                        >
                          {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                        </button>
                      </div>
                    </FormControl>
                    <span id="password-description" className="sr-only">
                      Enter your password to access your account
                    </span>
                    <FormMessage 
                      className="text-sm animate-in fade-in-50"
                      id="password-error"
                    />
                    
                    <div className="flex justify-end pt-2">
                      <Link 
                        href="/forgot-password" 
                        className="text-sm text-primary hover:text-primary/80 transition-colors font-medium focus:outline-none focus:underline"
                        aria-label="Reset your password if you've forgotten it"
                      >
                        Forgot your password?
                      </Link>
                    </div>
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary mt-4"
                disabled={isLoading}
                aria-describedby="submit-help"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner variant="bars" size={16} className="text-current" aria-hidden="true" />
                    <span>Signing in...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <FiLogIn size={18} aria-hidden="true" />
                    <span>Sign In</span>
                  </span>
                )}
              </Button>
              <span id="submit-help" className="sr-only">
                Click to sign in to your account with the provided credentials
              </span>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4 px-6 pb-8 flex-shrink-0">
              <div className="relative w-full my-4" role="separator" aria-label="Don't have an account?">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-muted-foreground/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-background px-3 text-muted-foreground">
                    Don't have an account?
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-base border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors"
                onClick={handleCreateAccountClick}
              >
                Create New Account
              </Button>

              <p className="text-center text-xs text-muted-foreground pt-2">
                By continuing, you agree to our{" "}
                <Link 
                  href="/terms" 
                  className="text-primary hover:underline font-medium focus:outline-none focus:underline"
                >
                  Terms
                </Link>
                {" "}and{" "}
                <Link 
                  href="/privacy" 
                  className="text-primary hover:underline font-medium focus:outline-none focus:underline"
                >
                  Privacy Policy
                </Link>
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
