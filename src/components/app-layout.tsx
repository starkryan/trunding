"use client";

import MobileLayout from "@/components/mobile-layout";
import { useAuth } from "@/context/auth-context";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  // Don't show mobile layout if not authenticated or still loading
  if (!session || loading) {
    return <>{children}</>;
  }

  return (
    <MobileLayout
      showHeader={false}
      showNavigation={true}
      safeArea={true}
      fullHeight={true}
    >
      {children}
    </MobileLayout>
  );
}