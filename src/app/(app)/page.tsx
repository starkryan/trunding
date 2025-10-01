"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Zap, Shield, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (session) {
        router.push("/home");
      }
    }
  }, [session, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background safe-top safe-bottom">
        <div className="flex flex-col items-center space-y-4">
          <Spinner variant="bars" size={32} className="text-primary" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // const features = [
  //   {
  //     icon: Smartphone,
  //     title: "Mobile-First",
  //     description: "Designed specifically for mobile devices"
  //   },
  //   {
  //     icon: Zap,
  //     title: "Lightning Fast",
  //     description: "Built with Next.js for optimal performance"
  //   },
  //   {
  //     icon: Shield,
  //     title: "Secure",
  //     description: "Protected with modern authentication"
  //   },
  //   {
  //     icon: Palette,
  //     title: "Beautiful UI",
  //     description: "Clean interface with shadcn/ui components"
  //   }
  // ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 safe-top safe-bottom">
      {/* Main Content */}
      <div className="container max-w-md mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-12">
          <div className="w-20 h-20 mx-auto bg-gradient-to-r from-primary to-primary/70 rounded-2xl flex items-center justify-center shadow-lg">
            <Zap className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Montra
          </h1>
          
          <p className="text-lg text-muted-foreground leading-relaxed">
            Experience the future of mobile-first web applications with seamless authentication and beautiful design.
          </p>
        </div>

        {/* Features Grid
        <div className="grid grid-cols-2 gap-4 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="text-center border-0 shadow-sm bg-background/50">
              <CardContent className="p-4">
                <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-full flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div> */}

        {/* App Preview Cards */}
        <div className="space-y-4 mb-12">
          <div className="flex space-x-4 overflow-x-auto pb-4 -mx-2 px-2">
            {[
              { title: "Dashboard", color: "from-blue-500 to-blue-600" },
              { title: "Profile", color: "from-green-500 to-green-600" },
              { title: "Settings", color: "from-purple-500 to-purple-600" },
            ].map((app, index) => (
              <div key={index} className="flex-shrink-0 w-32">
                <div className={cn(
                  "h-40 rounded-2xl bg-gradient-to-br p-4 flex flex-col justify-end",
                  app.color
                )}>
                  <span className="text-white font-medium text-sm">{app.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <div className="space-y-4">
          <Button 
            className="w-full h-14 text-lg font-semibold rounded-xl shadow-lg shadow-primary/25"
            onClick={() => router.push("/signup")}
            size="lg"
          >
            <Zap className="w-5 h-5 mr-2" />
            Get Started
          </Button>
          
          <div className="text-center">
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <Button 
                variant="link" 
                className="p-0 h-auto font-semibold text-primary"
                onClick={() => router.push("/signin")}
              >
                Sign In
              </Button>
            </p>
          </div>
        </div>
      </div>

      
    </div>
  );
}