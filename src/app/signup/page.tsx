"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { PasswordRequirementsAlert } from "@/components/password-requirements-alert";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setShowPasswordRequirements(false);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    // Check password requirements
    const hasMinLength = password.length >= 8;
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!hasMinLength || !hasSpecialChar) {
      setShowPasswordRequirements(true);
      setIsLoading(false);
      return;
    }

    try {
      // Sign up the user using email and password
      const signUpResult = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (signUpResult.error) {
        setError(signUpResult.error.message || "Sign up failed. Please try again.");
        return;
      }

      // After successful sign-up, send an OTP for email verification
      const otpResult = await authClient.emailOtp.sendVerificationOtp({
        email,
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
          <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
            <FiUser size={20} className="text-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Sign up</CardTitle>
          <CardDescription className="text-base max-w-md mx-auto">
            Create an account to get started.
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <CardContent className="space-y-6 px-6 flex-1 flex flex-col justify-center">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                {error}
              </div>
            )}
            
            {showPasswordRequirements && (
              <PasswordRequirementsAlert />
            )}
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base font-medium">Full Name</Label>
                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground size-5" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-12 h-12 text-base"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-medium">Email</Label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground size-5" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-12 text-base"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-base font-medium">Password</Label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground size-5" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-14 h-12 text-base"
                    required
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
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-base font-medium">Confirm Password</Label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground size-5" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-12 pr-14 h-12 text-base"
                    required
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
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 px-6 pb-6 pt-4">
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
      </Card>
    </div>
  );
}
