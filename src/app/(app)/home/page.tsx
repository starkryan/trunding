"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaBitcoin } from "react-icons/fa";
import { Spinner } from "@/components/ui/spinner";
import RewardServicesHome from "@/components/reward-services-home";
import Banner from "@/components/banner";
import RecentWins from "@/components/recent-wins";

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

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20">
      <div className="w-full">
        <div className="w-full">
          <div className="w-full">
            {/* Banner Section */}
            <Banner />

            {/* Recent Big Wins Section */}
            <RecentWins />

            {/* Reward Services Section - Full Width */}
            <RewardServicesHome />
          </div>
        </div>
      </div>
    </div>
  );
}
