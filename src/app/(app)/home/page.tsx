"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { FaBitcoin } from "react-icons/fa";
import { Spinner } from "@/components/ui/spinner";
import RewardServicesHome from "@/components/reward-services-home";
import { toast } from "sonner";

export default function HomePage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading && !session) {
      router.push("/signin");
    }
  }, [session, loading, router]);

  // Handle payment success notification
  useEffect(() => {
    const paymentSuccess = searchParams.get("payment_success");
    const orderId = searchParams.get("order_id");

    if (paymentSuccess === "true" && orderId) {
      // Add delay to ensure client-side rendering and toast system is ready
      const timer = setTimeout(() => {
        // Clear any existing toasts first to prevent duplicates
        toast.dismiss();

        // Show user-friendly success notification
        toast.success("🎉 Successfully invested", {
          duration: 6000,
          id: `payment-success-${orderId}`, // Unique ID to prevent duplicates
        });

        // Clean URL parameters after showing notification (only on client side)
        if (typeof window !== 'undefined') {
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, "", cleanUrl);
        }
      }, 100); // Small delay to ensure client-side rendering

      return () => clearTimeout(timer);
    }
  }, [searchParams]);

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
    <div className="min-h-screen w-full bg-background">
      <RewardServicesHome />
    </div>
  );
}
