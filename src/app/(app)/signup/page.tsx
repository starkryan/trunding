"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowLeft,
  FiCheck,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import Link from "next/link";

const formSchema = z
  .object({
    name: z.string().min(2, {
      message: "Name must be at least 2 characters.",
    }),
    email: z.string().email({
      message: "Please enter a valid email address.",
    }),
    password: z
      .string()
      .min(8, {
        message: "Password must be at least 8 characters.",
      })
      .regex(/[!@#$%^&*(),.?":{}|<>]/, {
        message: "Password must contain at least one special character.",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    const requirementsMet = [
      hasSpecialChar,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
    ].filter(Boolean).length;

    if (password.length >= 12 && requirementsMet >= 3)
      return { strength: 5, label: "Very Strong" };
    if (password.length >= 10 && requirementsMet >= 2)
      return { strength: 4, label: "Strong" };
    if (password.length >= 8 && requirementsMet >= 1)
      return { strength: 3, label: "Good" };

    return { strength: 2, label: "Weak" };
  };

  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setError(null);

    try {
      const signUpResult = await authClient.signUp.email({
        email: values.email,
        password: values.password,
        name: values.name,
      });

      if (signUpResult.error) {
        // Handle "USER_ALREADY_EXISTS" error specifically
        if (
          signUpResult.error.message?.includes("User already exists") ||
          signUpResult.error.code === "USER_ALREADY_EXISTS"
        ) {
          // Check if the user exists but is not verified
          try {
            // Try to send verification email to check if user exists
            const otpResult = await authClient.emailOtp.sendVerificationOtp({
              email: values.email,
              type: "email-verification",
            });

            if (otpResult.data) {
              // User exists and verification email was sent successfully
              toast.success(
                "An account with this email already exists but isn't verified. We've sent a new verification code to your email."
              );
              sessionStorage.setItem(
                "verificationData",
                JSON.stringify({
                  email: values.email,
                  type: "email-verification",
                })
              );
              router.push("/verify-otp");
              return;
            }
          } catch (otpError) {
            // If sending OTP fails, the user might be verified already
            setError(
              "An account with this email already exists. Please sign in instead."
            );
            return;
          }
        }

        setError(
          signUpResult.error.message || "Sign up failed. Please try again."
        );
        return;
      }

      if (signUpResult.data?.user && !signUpResult.data.user.emailVerified) {
        const otpResult = await authClient.emailOtp.sendVerificationOtp({
          email: values.email,
          type: "email-verification",
        });

        if (otpResult.error) {
          toast.error(
            "Account created successfully! However, failed to send verification email. Please check your email or try resending."
          );
          sessionStorage.setItem(
            "verificationData",
            JSON.stringify({
              email: values.email,
              type: "email-verification",
            })
          );
          router.push("/verify-otp");
          return;
        }

        toast.success(
          "Account created successfully! Please check your email for the 6-digit verification code."
        );
        sessionStorage.setItem(
          "verificationData",
          JSON.stringify({
            email: values.email,
            type: "email-verification",
          })
        );
        router.push("/verify-otp");
      } else {
        toast.success(
          "Account created successfully! Welcome to your dashboard."
        );
        router.push("/home");
      }
    } catch (err: any) {
      setError(
        err.message || "An unexpected error occurred. Please try again."
      );
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
            <FiUser className="absolute inset-0 m-auto text-primary size-6" />
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
              <FiUser className="text-white size-7" />
            </div>
            <div className="absolute -inset-1 bg-primary/20 rounded-2xl blur-sm -z-10"></div>
          </div>

          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text text-transparent">
              Join Us Today
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Create your account and start your journey
            </CardDescription>
          </div>
        </CardHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 flex flex-col"
          >
            <CardContent className="px-6 flex-1 flex flex-col justify-center space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg flex items-center animate-in fade-in-50">
                  <div className="w-2 h-2 bg-destructive rounded-full mr-2 animate-pulse"></div>
                  {error}
                </div>
              )}
              {/* Social Login Buttons */}
              <SocialLoginButtons
                callbackURL="/home"
                dividerText="Or continue with email"
                showDivider={false}
              />

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-base font-medium">
                        Full Name
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <FiUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/70 group-focus-within:text-primary transition-colors size-5" />
                          <Input
                            type="text"
                            placeholder="John Doe"
                            className="pl-12 h-12 text-base transition-all duration-200 border-muted-foreground/20 focus:border-primary/50 group-hover:border-muted-foreground/30"
                            {...field}
                            onFocus={() => setError(null)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-sm animate-in fade-in-50" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-base font-medium">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <FiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/70 group-focus-within:text-primary transition-colors size-5" />
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            className="pl-12 h-12 text-base transition-all duration-200 border-muted-foreground/20 focus:border-primary/50 group-hover:border-muted-foreground/30"
                            {...field}
                            onFocus={() => setError(null)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-sm animate-in fade-in-50" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-base font-medium">
                        Password
                      </FormLabel>
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
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                          >
                            {showPassword ? (
                              <FiEyeOff size={20} />
                            ) : (
                              <FiEye size={20} />
                            )}
                          </button>
                        </div>
                      </FormControl>

                      {/* Password Strength Indicator */}
                      {password.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">
                              Password strength:
                            </span>
                            <span
                              className={`font-medium ${
                                passwordStrength.strength >= 4
                                  ? "text-green-600"
                                  : passwordStrength.strength >= 3
                                    ? "text-yellow-600"
                                    : "text-red-600"
                              }`}
                            >
                              {passwordStrength.label}
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                passwordStrength.strength >= 4
                                  ? "bg-green-500"
                                  : passwordStrength.strength >= 3
                                    ? "bg-yellow-500"
                                    : passwordStrength.strength >= 2
                                      ? "bg-orange-500"
                                      : "bg-red-500"
                              }`}
                              style={{
                                width: `${(passwordStrength.strength / 5) * 100}%`,
                              }}
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
                      <FormLabel className="text-base font-medium">
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/70 group-focus-within:text-primary transition-colors size-5" />
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            className="pl-12 pr-12 h-12 text-base transition-all duration-200 border-muted-foreground/20 focus:border-primary/50 group-hover:border-muted-foreground/30"
                            {...field}
                            onFocus={() => setError(null)}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                            aria-label={
                              showConfirmPassword
                                ? "Hide password"
                                : "Show password"
                            }
                          >
                            {showConfirmPassword ? (
                              <FiEyeOff size={20} />
                            ) : (
                              <FiEye size={20} />
                            )}
                          </button>
                        </div>
                      </FormControl>

                      {/* Password Match Indicator */}
                      {confirmPassword.length > 0 && (
                        <div
                          className={`flex items-center gap-2 text-sm ${
                            passwordsMatch ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          <FiCheck
                            size={16}
                            className={
                              passwordsMatch ? "opacity-100" : "opacity-0"
                            }
                          />
                          <span>
                            {passwordsMatch
                              ? "Passwords match"
                              : "Passwords don't match"}
                          </span>
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
                    <Spinner
                      variant="bars"
                      size={16}
                      className="text-current"
                    />
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <FiUser size={18} />
                    <span>Create Account</span>
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
                  <span className="bg-card px-3 text-muted-foreground">
                    Already have an account?
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-base border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors"
                onClick={() => router.push("/signin")}
              >
                Sign In to Your Account
              </Button>

              <p className="text-center text-xs text-muted-foreground pt-2">
                By creating an account, you agree to our{" "}
                <Link
                  href="/terms"
                  className="text-primary hover:underline font-medium"
                >
                  Terms
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="text-primary hover:underline font-medium"
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
