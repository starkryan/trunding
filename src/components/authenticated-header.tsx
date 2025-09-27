"use client";

import { useAuth } from "@/context/auth-context";
import { Header } from "@/components/header";

export function AuthenticatedHeader() {
  const { session, loading } = useAuth();

  // Don't show header if not authenticated or still loading
  if (!session || loading) {
    return null;
  }

  return <Header />;
}
