"use client";

import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { useRouter } from "next/navigation";

export function AuthButtons() {
  const router = useRouter();

  return (
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
  );
}
