"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { FaBitcoin } from "react-icons/fa";
import { Spinner } from "@/components/ui/spinner";
import RewardServicesHome from "@/components/reward-services-home";
import toast from "react-hot-toast";

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
      // Clear any existing toasts first to prevent duplicates
      toast.dismiss();

      // Show user-friendly success notification
      toast.success(
        (
          <div className="text-left">
            <div className="font-semibold text-lg mb-1">Payment Successful!</div>
            <div className="text-sm opacity-90">Your account has been credited successfully</div>
          </div>
        ),
        {
          duration: 6000,
          position: "top-center",
          style: {
            background: '#10b981',
            color: '#ffffff',
            fontWeight: '400',
            padding: '20px 24px',
            borderRadius: '12px',
            minWidth: '320px',
            fontSize: '14px',
            lineHeight: '1.5',
          },
          iconTheme: {
            primary: '#ffffff',
            secondary: '#10b981',
          },
          id: `payment-success-${orderId}`, // Unique ID to prevent duplicates
        }
      );

      // Clean URL parameters after showing notification
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
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
