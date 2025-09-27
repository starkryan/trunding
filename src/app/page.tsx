"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";

export default function HomePage() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (session) {
        router.push("/dashboard");
      }
    }
  }, [session, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner variant="bars" size={32} className="text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Welcome to Montra
          </h1>
          <p className="mt-6 max-w-lg mx-auto text-xl text-gray-500">
            A Next.js application with better-auth integration
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <a
              href="/signin"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign In
            </a>
            <a
              href="/signup"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign Up
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
