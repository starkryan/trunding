"use client";

import { ReactNode } from "react";
import { Header } from "./header";
import { MobileTopBar, MobileBottomNavigation } from "./mobile-navigation";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: ReactNode;
  className?: string;
  showHeader?: boolean;
  showNavigation?: boolean;
  headerProps?: {
    title?: string;
    subtitle?: string;
    showBack?: boolean;
    backHref?: string;
    showHome?: boolean;
    centerTitle?: boolean;
    actions?: React.ReactNode;
    onBack?: () => void;
    transparent?: boolean;
  };
  safeArea?: boolean;
  fullHeight?: boolean;
}

export default function MobileLayout({
  children,
  className,
  showHeader = true,
  showNavigation = true,
  headerProps,
  safeArea = true,
  fullHeight = false
}: MobileLayoutProps) {
  // Determine which header to show with responsive logic
  const shouldShowTopBar = showNavigation && (!showHeader || (headerProps?.title === "Mintward" || !headerProps?.title));
  const shouldShowPageHeader = showHeader && !shouldShowTopBar;

  return (
    <div className={cn(
      "relative bg-background overflow-hidden",
      fullHeight && "min-h-screen",
      safeArea && "safe-top safe-bottom",
      className
    )}>
      {/* Mobile Top Bar - Only show if no page header or on main app pages */}
      {shouldShowTopBar && <MobileTopBar />}

      {/* Page Header - Only show if not showing top bar */}
      {shouldShowPageHeader && (
        <div className={cn(
          "transition-all duration-200",
          shouldShowTopBar && "pt-11" // Offset for top navigation
        )}>
          <Header {...headerProps} />
        </div>
      )}

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-200",
        // Calculate offsets based on visible components
        shouldShowTopBar && shouldShowPageHeader && "pt-11 md:pt-0", // Both nav and header
        shouldShowTopBar && !shouldShowPageHeader && "pt-11 md:pt-0", // Only nav
        !shouldShowTopBar && shouldShowPageHeader && "pt-0", // Only header (has its own spacing)
        !shouldShowTopBar && !shouldShowPageHeader && "pt-0", // Neither
        showNavigation && "pb-16 md:pb-0" // Bottom navigation offset
      )}>
        {children}
      </main>

      {/* Bottom Navigation - Responsive */}
      {showNavigation && <MobileBottomNavigation />}
    </div>
  );
}