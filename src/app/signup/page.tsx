"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { PasswordRequirementsAlert } from "@/components/password-requirements-alert";
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
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
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

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  const router = useRouter();
  const { session, loading } = useAuth();

  // Redirect authenticated users to home
  useEffect(() => {
    if (!loading && session) {
      router.push("/home");
    }
  }, [session, loading, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = form.watch("password");

  useEffect(() => {
    const hasMinLength = password.length >= 8;
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    setShowPasswordRequirements(password.length > 0 && (!hasMinLength || !hasSpecialChar));
  }, [password]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setError(null);

    try {
      // Sign up the user using email and password
      const signUpResult = await authClient.signUp.email({
        email: values.email,
        password: values.password,
        name: values.name,
      });

      if (signUpResult.error) {
        setError(signUpResult.error.message || "Sign up failed. Please try again.");
        return;
      }

      // After successful sign-up, send an OTP for email verification
      const otpResult = await authClient.emailOtp.sendVerificationOtp({
        email: values.email,
        type: "email-verification",
      });

      if (otpResult.error) {
        // If OTP sending fails, still sign up was successful, but inform the user
        toast.error("Account created, but failed to send verification email. Please try resending.");
        // Optionally, still redirect to verification page or let them handle it from profile
        // For now, we'll redirect and they can try resending.
      } else if (otpResult.data?.success) {
        toast.success("Account created! Please check your email for the verification code.");
      }
      
      // Redirect to home page after successful sign-up
      router.push("/home");

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="h-screen w-full bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render the form if user is authenticated (will be redirected by useEffect)
  if (session) {
    return null;
  }

  return (
    <div className="h-screen w-full bg-background flex flex-col">

      
      <Card className="flex-1 w-full rounded-none shadow-none border-0 bg-background">
        <CardHeader className="space-y-3 px-6 pt-6 text-center">
          <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
            <FiUser size={20} className="text-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Sign up</CardTitle>
          <CardDescription className="text-base max-w-md mx-auto">
            Create an account to get started.
          </CardDescription>
        </CardHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col">
            <CardContent className="space-y-4 px-6 flex-1 flex flex-col justify-center pb-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                  {error}
                </div>
              )}
              
              {showPasswordRequirements && <PasswordRequirementsAlert />}
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Full Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <FiUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground size-5" />
                          <Input
                            type="text"
                            placeholder="John Doe"
                            className="pl-12 h-12 text-base"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <FiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground size-5" />
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            className="pl-12 h-12 text-base"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground size-5" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            className="pl-12 pr-14 h-12 text-base"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground size-5" />
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            className="pl-12 pr-14 h-12 text-base"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 px-6 pb-6">
            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
            
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <a href="/signin" className="font-medium text-primary hover:underline">
                Sign in
              </a>
            </p>
          </CardFooter>
        </form>
        </Form>
      </Card>
    </div>
  );
}
