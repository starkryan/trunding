"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FiShield, FiArrowLeft, FiCheck, FiMail } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { toast } from "react-hot-toast";
import { Spinner } from "@/components/ui/spinner";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

function VerifyOTPForm() {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpStatus, setOtpStatus] = useState<"idle" | "correct" | "incorrect">("idle");
  const [email, setEmail] = useState<string>("");
  const [type, setType] = useState<"email-verification" | "forget-password" | null>(null);
  const [resendLoading, setResendLoading] = useState(false);

  const router = useRouter();
  const { session, loading } = useAuth();

  // Redirect authenticated users to home
  useEffect(() => {
    if (!loading && session) {
      router.push("/home");
    }
  }, [session, loading, router]);

  // Get email and type from session storage
  useEffect(() => {
    const storedVerificationData = sessionStorage.getItem("verificationData");
    
    if (storedVerificationData) {
      try {
        const { email: storedEmail, type: storedType } = JSON.parse(storedVerificationData);
        setEmail(storedEmail);
        setType(storedType);
      } catch (error) {
        console.error("Failed to parse verification data:", error);
        toast.error("Invalid verification session. Please try signing up again.");
        router.push("/signup");
      }
    } else {
      // Fallback: check if user has a session and needs email verification
      const checkUserSession = async () => {
        try {
          const { data: session } = await authClient.getSession();
          if (session?.user && !session.user.emailVerified) {
            setEmail(session.user.email);
            setType("email-verification");
          } else {
            toast.error("No active verification session found. Please try signing up again.");
            router.push("/signup");
          }
        } catch (error) {
          toast.error("Failed to verify session. Please try signing up again.");
          router.push("/signup");
        }
      };
      
      checkUserSession();
    }
  }, [router]);

  useEffect(() => {
    if (email && type) {
      sessionStorage.setItem("verificationData", JSON.stringify({ email, type }));
    }
  }, [email, type]);

  useEffect(() => {
    if (otp.length < 6) {
      setOtpStatus("idle");
    }
  }, [otp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !type) {
      toast.error("Email or verification type is missing.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setOtpStatus("idle");

    try {
      let result: any;
      if (type === "email-verification") {
        result = await authClient.emailOtp.verifyEmail({
          email,
          otp,
        });
        if (result.data?.status) {
          setOtpStatus("correct");
          setTimeout(() => {
            toast.success("Email verified successfully! Welcome to your dashboard.");
            // Clear verification data
            sessionStorage.removeItem("verificationData");
            router.push("/home");
          }, 1000);
          return;
        }
      } else if (type === "forget-password") {
        result = await authClient.emailOtp.checkVerificationOtp({
          email,
          otp,
          type: "forget-password",
        });
        if (result.data?.success) {
          setOtpStatus("correct");
          setTimeout(() => {
            toast.success("OTP verified! Please reset your password.");
            // Clear verification data
            sessionStorage.removeItem("verificationData");
            router.push("/reset-password?token=" + result.data.token);
          }, 1000);
          return;
        }
      }

      if (result?.error) {
        setOtpStatus("incorrect");
        setError(result.error.message || "Invalid OTP. Please try again.");
        setTimeout(() => setOtpStatus("idle"), 1000);
      }
    } catch (err: any) {
      setOtpStatus("incorrect");
      setError(err.message || "An unexpected error occurred. Please try again.");
      setTimeout(() => setOtpStatus("idle"), 1000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || !type) {
      toast.error("Cannot resend OTP. Email or type is missing.");
      return;
    }
    try {
      setResendLoading(true);
      const result = await authClient.emailOtp.sendVerificationOtp({
        email,
        type,
      });
      if (result.data?.success) {
        toast.success("A new OTP has been sent to your email.");
      } else if (result.error) {
        toast.error(result.error.message || "Failed to resend OTP.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to resend OTP.");
    } finally {
      setResendLoading(false);
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
      <Card className="flex-1 w-full rounded-none shadow-none border-0 bg-background sm:rounded-lg sm:shadow-lg sm:border sm:max-w-md mx-auto my-8">
        
        <CardHeader className="space-y-4 px-6 pt-8 text-center flex-shrink-0">
          <div className="relative mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
              <FiShield className="text-white size-7" />
            </div>
            <div className="absolute -inset-1 bg-primary/20 rounded-2xl blur-sm -z-10"></div>
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text text-transparent">
              Verify Your Email
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Enter the 6-digit code sent to <span className="font-medium text-foreground">{email}</span>
            </CardDescription>
          </div>
        </CardHeader>
        
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <CardContent className="px-6 flex-1 flex flex-col justify-center space-y-6">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg flex items-center animate-in fade-in-50">
                <div className="w-2 h-2 bg-destructive rounded-full mr-2 animate-pulse"></div>
                {error}
              </div>
            )}
            
            <div className="space-y-4 flex flex-col items-center">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <FiMail size={16} />
                  <span className="text-sm">Check your email for the verification code</span>
                </div>
              </div>
              
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(otpValue) => setOtp(otpValue.replace(/[^0-9]/g, ""))}
                className="justify-center"
                required
              >
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className={cn(
                        "w-12 h-12 text-lg border-2 transition-all duration-200",
                        "border-muted-foreground/20 focus:border-primary/50 hover:border-muted-foreground/30",
                        otpStatus === "correct" && "border-green-500 bg-green-50 animate-pulse",
                        otpStatus === "incorrect" && "border-destructive bg-destructive/10"
                      )}
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              
              {otpStatus === "correct" && (
                <div className="flex items-center gap-2 text-green-600 text-sm animate-in fade-in-50">
                  <FiCheck size={16} />
                  <span>OTP verified successfully!</span>
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Spinner variant="bars" size={16} className="text-current" />
                  <span>Verifying...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <FiShield size={18} />
                  <span>Verify & Continue</span>
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
                <span className="bg-card px-3 text-muted-foreground">Need help?</span>
              </div>
            </div>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={handleResend}
                className="text-base text-primary hover:text-primary/80 transition-colors font-medium disabled:opacity-50"
                disabled={resendLoading}
              >
                {resendLoading ? "Sending..." : "Didn't receive the code? Resend"}
              </button>
              
              <p className="text-xs text-muted-foreground">
                The code will expire in 15 minutes. Please check your spam folder if you don't see it.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-base border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors"
              onClick={() => router.back()}
            >
              <FiArrowLeft size={16} className="mr-2" />
              Go Back
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <Spinner variant="bars" size={64} className="text-primary mx-auto" />
            <FiShield className="absolute inset-0 m-auto text-primary size-6" />
          </div>
        </div>
      </div>
    }>
      <VerifyOTPForm />
    </Suspense>
  );
}
