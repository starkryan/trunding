"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiLock, FiEye, FiEyeOff, FiCheck, FiArrowLeft } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
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

const formSchema = z.object({
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }).regex(/[!@#$%^&*(),.?":{}|<>]/, {
    message: "Password must contain at least one special character.",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { session, loading } = useAuth();

  // Redirect authenticated users to home
  useEffect(() => {
    if (!loading && session) {
      router.push("/home");
    }
  }, [session, loading, router]);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
      setError("Invalid reset link. Please request a new password reset.");
    }
  }, [token]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const password = form.watch("password");
  const confirmPassword = form.watch("confirmPassword");

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: "" };
    if (password.length < 4) return { strength: 1, label: "Very Weak" };
    if (password.length < 8) return { strength: 2, label: "Weak" };
    
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    
    const requirementsMet = [hasSpecialChar, hasUpperCase, hasLowerCase, hasNumbers].filter(Boolean).length;
    
    if (password.length >= 12 && requirementsMet >= 3) return { strength: 5, label: "Very Strong" };
    if (password.length >= 10 && requirementsMet >= 2) return { strength: 4, label: "Strong" };
    if (password.length >= 8 && requirementsMet >= 1) return { strength: 3, label: "Good" };
    
    return { strength: 2, label: "Weak" };
  };

  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!token) {
      setError("Invalid reset link. Please request a new password reset.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const resetPasswordResult = await authClient.resetPassword({
        newPassword: values.password,
        token: token,
      });

      if (resetPasswordResult.error) {
        setError(resetPasswordResult.error.message || "Failed to reset password. Please try again.");
        return;
      }

      setIsSuccess(true);
      toast.success("Password reset successfully! You can now sign in with your new password.");

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
            <FiLock className="absolute inset-0 m-auto text-primary size-6" />
          </div>
        </div>
      </div>
    );
  }

  // Don't render the form if user is authenticated
  if (session) {
    return null;
  }

  if (!isValidToken) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
        <Card className="flex-1 w-full rounded-none shadow-none border-0 bg-background sm:rounded-lg sm:shadow-lg sm:border sm:max-w-md mx-auto my-8">
          <CardHeader className="space-y-4 px-6 pt-8 text-center flex-shrink-0">
            <div className="relative mx-auto">
              <div className="w-16 h-16 bg-gradient-to-br from-destructive to-destructive/80 rounded-2xl flex items-center justify-center shadow-lg">
                <FiLock className="text-white size-7" />
              </div>
              <div className="absolute -inset-1 bg-destructive/20 rounded-2xl blur-sm -z-10"></div>
            </div>
            
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text text-transparent">
                Invalid Reset Link
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                The password reset link is invalid or has expired.
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="px-6 flex-1 flex flex-col justify-center space-y-6">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Please request a new password reset link to continue.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                type="button"
                className="w-full h-12 text-base font-semibold shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                onClick={() => router.push("/forgot-password")}
              >
                Request New Reset Link
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-base border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors"
                onClick={() => router.push("/signin")}
              >
                Return to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
        <Card className="flex-1 w-full rounded-none shadow-none border-0 bg-background sm:rounded-lg sm:shadow-lg sm:border sm:max-w-md mx-auto my-8">
          <CardHeader className="space-y-4 px-6 pt-8 text-center flex-shrink-0">
            <div className="relative mx-auto">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-500/80 rounded-2xl flex items-center justify-center shadow-lg">
                <FiCheck className="text-white size-7" />
              </div>
              <div className="absolute -inset-1 bg-green-500/20 rounded-2xl blur-sm -z-10"></div>
            </div>
            
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text text-transparent">
                Password Reset Successful!
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Your password has been updated successfully.
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="px-6 flex-1 flex flex-col justify-center space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <FiCheck className="text-green-600 size-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Password Updated Successfully!</h3>
                <p className="text-muted-foreground">
                  You can now sign in to your account with your new password.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                type="button"
                className="w-full h-12 text-base font-semibold shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                onClick={() => router.push("/signin")}
              >
                Sign In to Your Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      <Card className="flex-1 w-full rounded-none shadow-none border-0 bg-background sm:rounded-lg sm:shadow-lg sm:border sm:max-w-md mx-auto my-8">
        
        <CardHeader className="space-y-4 px-6 pt-8 text-center flex-shrink-0">
          <div className="relative mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
              <FiLock className="text-white size-7" />
            </div>
            <div className="absolute -inset-1 bg-primary/20 rounded-2xl blur-sm -z-10"></div>
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text text-transparent">
              Reset Your Password
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Create a new strong password for your account
            </CardDescription>
          </div>
        </CardHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col">
            <CardContent className="px-6 flex-1 flex flex-col justify-center space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg flex items-center animate-in fade-in-50">
                  <div className="w-2 h-2 bg-destructive rounded-full mr-2 animate-pulse"></div>
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-base font-medium">New Password</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/70 group-focus-within:text-primary transition-colors size-5" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a strong password"
                            className="pl-12 pr-12 h-12 text-base transition-all duration-200 border-muted-foreground/20 focus:border-primary/50 group-hover:border-muted-foreground/30"
                            {...field}
                            onFocus={() => setError(null)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                          </button>
                        </div>
                      </FormControl>
                      
                      {/* Password Strength Indicator */}
                      {password.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Password strength:</span>
                            <span className={`font-medium ${
                              passwordStrength.strength >= 4 ? "text-green-600" :
                              passwordStrength.strength >= 3 ? "text-yellow-600" :
                              "text-red-600"
                            }`}>
                              {passwordStrength.label}
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                passwordStrength.strength >= 4 ? "bg-green-500" :
                                passwordStrength.strength >= 3 ? "bg-yellow-500" :
                                passwordStrength.strength >= 2 ? "bg-orange-500" :
                                "bg-red-500"
                              }`}
                              style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      <FormMessage className="text-sm animate-in fade-in-50" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-base font-medium">Confirm New Password</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/70 group-focus-within:text-primary transition-colors size-5" />
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your new password"
                            className="pl-12 pr-12 h-12 text-base transition-all duration-200 border-muted-foreground/20 focus:border-primary/50 group-hover:border-muted-foreground/30"
                            {...field}
                            onFocus={() => setError(null)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                          </button>
                        </div>
                      </FormControl>
                      
                      {/* Password Match Indicator */}
                      {confirmPassword.length > 0 && (
                        <div className={`flex items-center gap-2 text-sm ${
                          passwordsMatch ? "text-green-600" : "text-red-600"
                        }`}>
                          <FiCheck size={16} className={passwordsMatch ? "opacity-100" : "opacity-0"} />
                          <span>{passwordsMatch ? "Passwords match" : "Passwords don't match"}</span>
                        </div>
                      )}
                      
                      <FormMessage className="text-sm animate-in fade-in-50" />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary mt-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Spinner variant="bars" size={16} className="text-current" />
                    <span>Resetting Password...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <FiLock size={18} />
                    <span>Reset Password</span>
                  </div>
                )}
              </Button>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4 px-6 pb-8 flex-shrink-0">
              <div className="relative w-full my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-muted-foreground/20"></div>
                </div>
                <div className="relative flex justify-center text-sm uppercase">
                  <span className="bg-card px-3 text-muted-foreground">Remember your password?</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-base border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors"
                onClick={() => router.push("/signin")}
              >
                Return to Sign In
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
