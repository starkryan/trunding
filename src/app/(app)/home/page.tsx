"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { Bitcoin } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import RewardServicesHome from "@/components/reward-services-home";

export default function HomePage() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.push("/signin");
    }
  }, [session, loading, router]);

  if (loading) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <Spinner variant="bars" size={64} className="text-primary mx-auto" />
            <Bitcoin className="absolute inset-0 m-auto text-primary size-6" />
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20">
      <div className="w-full max-w-none rounded-none border-0 bg-background">
        <div className="w-full">
          <div className="p-6 w-full">
      
            
            {/* Reward Services Section - Full Width */}
            <RewardServicesHome />
          </div>
        </div>
      </div>
    </div>
  );
}
