"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft } from "react-icons/fi";
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
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
        callbackURL: "/home",
      }, {
        onSuccess: (ctx) => {
          toast.success(`Welcome back!`);
          router.push("/home");
        },
        onError: (ctx) => {
          setError(ctx.error.message || "Sign in failed. Please check your credentials.");
        },
      });
      
      if (error) {
        setError(error.message || "Sign in failed. Please check your credentials.");
      }
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
          <Spinner variant="bars" size={32} className="text-primary mb-4" />

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
            <FiLock size={20} className="text-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription className="text-base max-w-md mx-auto">
            Welcome back! Please enter your details.
          </CardDescription>
        </CardHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col">
            <CardContent className="px-6 flex-1 flex flex-col justify-center">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                  {error}
                </div>
              )}
              
              <div className="space-y-3 pb-4">
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
                            placeholder="••••••••"
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
                      <Button 
                        type="submit" 
                        className="w-full h-12 text-base font-semibold shadow-sm hover:shadow-md transition-shadow disabled:shadow-none mt-4" 
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center gap-2">
                            <Spinner variant="bars" size={16} className="text-current" />
                            <span>Signing In...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <FiLock size={18} />
                            <span>Sign In</span>
                          </div>
                        )}
                      </Button>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 px-6 pb-6">
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <a href="/signup" className="font-medium text-primary hover:underline">
                Sign up
              </a>
            </p>
          </CardFooter>
        </form>
        </Form>
      </Card>
    </div>
  );
}
