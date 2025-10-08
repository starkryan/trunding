"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
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
import toast, { Toaster } from "react-hot-toast";
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

  // Redirect authenticated users to home
  useEffect(() => {
    if (!loading && session) {
      router.push("/home");
    }
  }, [session, loading, router]);

  // Password strength calculator
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
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  const handleExistingUser = async (email: string) => {
    try {
      const otpResult = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });

      if (otpResult.data) {
        toast.success("Account exists! Check your email for verification code.");
        sessionStorage.setItem(
          "verificationData",
          JSON.stringify({
            email,
            type: "email-verification",
          })
        );
        router.push("/verify-otp");
        return true;
      }
    } catch {
      setError("An account with this email already exists. Please sign in instead.");
      return true;
    }
    return false;
  };

  const handleVerification = async (email: string) => {
    const otpResult = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "email-verification",
    });

    if (otpResult.error) {
      toast.error("Verification email failed. Please try again.");
    } else {
      toast.success("Check your email for verification code.");
    }

    sessionStorage.setItem(
      "verificationData",
      JSON.stringify({
        email,
        type: "email-verification",
      })
    );
    router.push("/verify-otp");
  };

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
        const isExistingUser =
          signUpResult.error.message?.includes("User already exists") ||
          signUpResult.error.code === "USER_ALREADY_EXISTS";

        if (isExistingUser) {
          const handled = await handleExistingUser(values.email);
          if (handled) return;
        }

        setError(signUpResult.error.message || "Sign up failed. Please try again.");
        return;
      }

      if (signUpResult.data?.user && !signUpResult.data.user.emailVerified) {
        await handleVerification(values.email);
      } else {
        toast.success("Account created! Welcome aboard.");
        router.push("/home");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const handleSignInClick = () => {
    router.push("/signin");
  };

  const getPasswordStrengthColor = (strength: number) => {
    if (strength >= 4) return "text-green-600";
    if (strength >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  const getPasswordBarColor = (strength: number) => {
    if (strength >= 4) return "bg-green-500";
    if (strength >= 3) return "bg-yellow-500";
    if (strength >= 2) return "bg-orange-500";
    return "bg-red-500";
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-16 h-16">
              <Image
                src="/logo.png"
                alt="Montra Logo"
                fill
                className="object-contain animate-pulse"
                priority
              />
            </div>
            <Spinner variant="bars" size={32} className="text-primary" />
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

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel 
                        className="text-base font-medium"
                        htmlFor="name-input"
                      >
                        Full Name
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <FiUser 
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/70 group-focus-within:text-primary transition-colors size-5 pointer-events-none" 
                            aria-hidden="true"
                          />
                          <Input
                            id="name-input"
                            type="text"
                            placeholder="Your full name"
                            autoComplete="name"
                            className="pl-12 h-12 text-base transition-all duration-200 border-muted-foreground/20 focus:border-primary/50 group-hover:border-muted-foreground/30"
                            aria-describedby="name-description name-error"
                            aria-invalid={!!form.formState.errors.name}
                            {...field}
                            onFocus={clearError}
                          />
                        </div>
                      </FormControl>
                      <span id="name-description" className="sr-only">
                        Enter your full name to create your account
                      </span>
                      <FormMessage 
                        className="text-sm animate-in fade-in-50"
                        id="name-error"
                      />
                    </FormItem>
                  )}
                />

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
                        Enter your email address to create your account
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
                            placeholder="Create a strong password"
                            autoComplete="new-password"
                            className="pl-12 pr-12 h-12 text-base transition-all duration-200 border-muted-foreground/20 focus:border-primary/50 group-hover:border-muted-foreground/30"
                            aria-describedby="password-description password-error password-strength"
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
                        Create a strong password for your account security
                      </span>

                      {password.length > 0 && (
                        <div className="space-y-2 pt-2" role="region" aria-label="Password strength indicator" id="password-strength">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Password strength:</span>
                            <span
                              className={`font-medium ${getPasswordStrengthColor(passwordStrength.strength)}`}
                              aria-live="polite"
                            >
                              {passwordStrength.label}
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${getPasswordBarColor(passwordStrength.strength)}`}
                              style={{
                                width: `${(passwordStrength.strength / 5) * 100}%`,
                              }}
                              role="progressbar"
                              aria-valuenow={passwordStrength.strength}
                              aria-valuemin={0}
                              aria-valuemax={5}
                              aria-label={`Password strength: ${passwordStrength.label}`}
                            />
                          </div>
                        </div>
                      )}

                      <FormMessage 
                        className="text-sm animate-in fade-in-50"
                        id="password-error"
                      />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel 
                        className="text-base font-medium"
                        htmlFor="confirm-password-input"
                      >
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <FiLock 
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/70 group-focus-within:text-primary transition-colors size-5 pointer-events-none" 
                            aria-hidden="true"
                          />
                          <Input
                            id="confirm-password-input"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            autoComplete="new-password"
                            className="pl-12 pr-12 h-12 text-base transition-all duration-200 border-muted-foreground/20 focus:border-primary/50 group-hover:border-muted-foreground/30"
                            aria-describedby="confirm-password-description confirm-password-error confirm-password-match"
                            aria-invalid={!!form.formState.errors.confirmPassword}
                            {...field}
                            onFocus={clearError}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            aria-pressed={showConfirmPassword}
                            tabIndex={0}
                          >
                            {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                          </button>
                        </div>
                      </FormControl>
                      <span id="confirm-password-description" className="sr-only">
                        Confirm your password by entering it again
                      </span>

                      {confirmPassword.length > 0 && (
                        <div
                          className={`flex items-center gap-2 text-sm ${
                            passwordsMatch ? "text-green-600" : "text-red-600"
                          }`}
                          role="status"
                          aria-live="polite"
                          id="confirm-password-match"
                        >
                          <FiCheck
                            size={16}
                            className={passwordsMatch ? "opacity-100" : "opacity-0"}
                            aria-hidden="true"
                          />
                          <span>
                            {passwordsMatch ? "Passwords match" : "Passwords don't match"}
                          </span>
                        </div>
                      )}

                      <FormMessage 
                        className="text-sm animate-in fade-in-50"
                        id="confirm-password-error"
                      />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary mt-4"
                disabled={isLoading}
                aria-describedby="submit-help"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner variant="bars" size={16} className="text-current" aria-hidden="true" />
                    <span>Creating Account...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <FiUser size={18} aria-hidden="true" />
                    <span>Create Account</span>
                  </span>
                )}
              </Button>
              <span id="submit-help" className="sr-only">
                Click to create your account with the provided information
              </span>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 px-6 pb-8 flex-shrink-0">
              <div className="relative w-full my-4" role="separator" aria-label="Already have an account?">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-muted-foreground/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-background px-3 text-muted-foreground">
                    Already have an account?
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-base border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors"
                onClick={handleSignInClick}
              >
                Sign In to Your Account
              </Button>

              <p className="text-center text-xs text-muted-foreground pt-2">
                By creating an account, you agree to our{" "}
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
