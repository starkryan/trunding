"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

function VerifyOTPForm() {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpStatus, setOtpStatus] = useState<"idle" | "correct" | "incorrect">("idle");

  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const type = searchParams.get("type") as "email-verification" | "forget-password" | null;

  useEffect(() => {
    if (!email || !type) {
      toast.error("Invalid verification link. Missing email or type.");
      router.push("/signin");
    }
  }, [email, type, router]);

  useEffect(() => {
    // Reset status when OTP changes
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
      let result;
      if (type === "email-verification") {
        result = await authClient.emailOtp.verifyEmail({
          email,
          otp,
        });
        if (result.data?.status) {
          setOtpStatus("correct");
          setTimeout(() => {
            toast.success("Email verified successfully! Welcome to your dashboard.");
            router.push("/home");
          }, 1000); // Delay to allow animation
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
            toast.success("OTP verified! Welcome to your dashboard.");
            router.push("/home"); 
          }, 1000); // Delay to allow animation
          return;
        }
      }

      if (result?.error) {
        setOtpStatus("incorrect");
        setError(result.error.message || "Invalid OTP. Please try again.");
        setTimeout(() => setOtpStatus("idle"), 1000); // Reset status after animation
      }
    } catch (err: any) {
      setOtpStatus("incorrect");
      setError(err.message || "An unexpected error occurred. Please try again.");
      setTimeout(() => setOtpStatus("idle"), 1000); // Reset status after animation
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
      setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-background flex flex-col">
      {/* App-like header with back button */}
      <div className="p-4 flex items-center">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          className="p-2 h-auto"
        >
          <FiArrowLeft size={20} />
        </Button>
      </div>
      
      <Card className="flex-1 w-full rounded-none shadow-none border-0 bg-background">
        <CardHeader className="space-y-3 px-6 pt-6 text-center">
          <CardTitle className="text-2xl font-bold">Verify OTP</CardTitle>
          <CardDescription className="text-base max-w-md mx-auto">
            Enter the 6-digit code sent to <span className="font-medium">{email}</span>
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <CardContent className="space-y-6 px-6 flex-1 flex flex-col justify-center">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="space-y-4 flex flex-col items-center">
              <Label htmlFor="otp" className="text-base font-medium">One-Time Password</Label>
              <InputOTP
                id="otp"
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
                        "w-10 h-10 text-lg",
                        otpStatus === "correct" && "border-green-500 animate-pulse",
                        otpStatus === "incorrect" && "border-destructive"
                      )}
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 px-6 pb-6 pt-4">
            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading || otp.length !== 6}>
              {isLoading ? "Verifying..." : "Verify & Continue"}
            </Button>
            
            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                className="text-base text-primary hover:underline disabled:opacity-50"
                disabled={isLoading}
              >
                Didn't receive the code? Resend
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyOTPForm />
    </Suspense>
  );
}
