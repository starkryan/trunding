"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FiMail, FiArrowLeft, FiCheck, FiLock } from "react-icons/fi";
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
import Link from "next/link";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
});

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmailSent, setIsEmailSent] = useState(false);

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
      email: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setError(null);

    try {
      const forgotPasswordResult = await authClient.forgetPassword({
        email: values.email,
        redirectTo: "/reset-password",
      });

      if (forgotPasswordResult.error) {
        setError(
          forgotPasswordResult.error.message ||
            "Failed to send reset email. Please try again."
        );
        return;
      }

      setIsEmailSent(true);
      toast.success("Password reset email sent! Please check your inbox.");
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
      <Card className="flex-1 w-full rounded-none shadow-none border-0 bg-background sm:rounded-lg sm:border sm:max-w-md mx-auto my-8">
        <CardHeader className="space-y-4 px-6 pt-8 text-center flex-shrink-0">
          <div className="relative mx-auto w-16 h-16">
            <Image
              src="/logo.png"
              alt="Montra Logo"
              fill
              className="object-contain"
              priority
            />
          </div>

          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text text-transparent">
              Forgot Password?
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              {isEmailSent
                ? "Check your email for reset instructions"
                : "Enter your email and we'll send you a reset link"}
            </CardDescription>
          </div>
        </CardHeader>

        {!isEmailSent ? (
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

                <div className="space-y-4">
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
                              placeholder="Enter your email"
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
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold transition-all duration-200 disabled:opacity-50 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary mt-4"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Spinner
                        variant="bars"
                        size={16}
                        className="text-current"
                      />
                      <span>Sending Reset Link...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <FiMail size={18} />
                      <span>Send Reset Link</span>
                    </div>
                  )}
                </Button>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4 px-6 pb-8 flex-shrink-0">
                <div className="relative w-full my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-muted-foreground/20"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-background px-3 text-muted-foreground">
                      Remember your password?
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
              </CardFooter>
            </form>
          </Form>
        ) : (
          <CardContent className="px-6 flex-1 flex flex-col justify-center space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <FiCheck className="text-green-600 size-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  Email Sent Successfully!
                </h3>
                <p className="text-muted-foreground">
                  We've sent a password reset link to{" "}
                  <strong>{form.getValues("email")}</strong>. Please check your
                  inbox and follow the instructions to reset your password.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-base border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors"
                onClick={() => {
                  setIsEmailSent(false);
                  form.reset();
                }}
              >
                Send to Another Email
              </Button>

              <Button
                type="button"
                className="w-full h-12 text-base font-semibold transition-all duration-200 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                onClick={() => router.push("/signin")}
              >
                Return to Sign In
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground pt-4">
              Didn't receive the email? Check your spam folder or try again.
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
