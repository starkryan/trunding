"use client";

import MobileLayout from "@/components/mobile-layout";
import { useAuth } from "@/context/auth-context";
import { usePathname } from "next/navigation";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const pathname = usePathname();

  // For the root path, don't use mobile layout since it's handled server-side
  if (pathname === "/") {
    return <>{children}</>;
  }

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
