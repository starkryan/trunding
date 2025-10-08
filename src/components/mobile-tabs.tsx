"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
// import { useLinkStatus } from "next/link"; // Removed due to hooks order issues
import { memo, useState, useCallback } from "react";
import {
  FaHome,
  FaChartLine,
  FaChartBar,
  FaUser,
  FaChartPie,
  FaExchangeAlt
} from "react-icons/fa";

// Type-safe navigation structure following Next.js best practices
type Route = `/home` | `/market` | `/transactions` | `/profile`;

interface TabItem {
  href: Route;
  label: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  "aria-label": string;
}

// Memoized tabs configuration with accessibility support
const tabs: TabItem[] = [
  {
    href: "/home",
    label: "Home",
    icon: <FaHome className="h-5 w-5" aria-hidden="true" />,
    activeIcon: <FaHome className="h-5 w-5" aria-hidden="true" />,
    "aria-label": "Navigate to home dashboard",
  },
  {
    href: "/market",
    label: "Market",
    icon: <FaChartLine className="h-5 w-5" aria-hidden="true" />,
    activeIcon: <FaChartLine className="h-5 w-5" aria-hidden="true" />,
    "aria-label": "Navigate to market overview",
  },
  {
    href: "/transactions",
    label: "Transactions",
    icon: <FaExchangeAlt className="h-5 w-5" aria-hidden="true" />,
    activeIcon: <FaExchangeAlt className="h-5 w-5" aria-hidden="true" />,
    "aria-label": "Navigate to transaction history",
  },
  {
    href: "/profile",
    label: "Profile",
    icon: <FaUser className="h-5 w-5" aria-hidden="true" />,
    activeIcon: <FaUser className="h-5 w-5" aria-hidden="true" />,
    "aria-label": "Navigate to user profile",
  },
] as const;

// Optimized individual tab component with accessibility and performance
const TabItem = memo(function TabItem({
  tab,
  isActive,
  isPending,
  onHoverStart,
  onHoverEnd
}: {
  tab: TabItem;
  isActive: boolean;
  isPending: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    onHoverStart();
  }, [onHoverStart]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    onHoverEnd();
  }, [onHoverEnd]);

  // Implement hover-based prefetching for performance
  const shouldPrefetch = isHovered;

  return (
    <Link
      href={tab.href}
      prefetch={shouldPrefetch}
      scroll={false}
      aria-label={tab["aria-label"]}
      aria-current={isActive ? "page" : undefined}
      role="tab"
      tabIndex={0}
      className={cn(
        "flex flex-col items-center justify-center min-w-[60px] py-2 px-3 rounded-lg transition-all duration-200 relative",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        "active:scale-95 touch-manipulation",
        isActive
          ? "text-primary bg-primary/10"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
        isPending && "opacity-70 pointer-events-none"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          // Handle keyboard navigation
        }
      }}
    >
      <div className="relative">
        {isActive ? tab.activeIcon : tab.icon}
        {isPending && (
          <div className="absolute -top-1 -right-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
          </div>
        )}
      </div>
      <span className={cn(
        "text-xs mt-1 transition-all duration-200",
        isActive ? "font-semibold" : "font-normal"
      )}>
        {tab.label}
      </span>
      {/* Accessibility indicator for active tab */}
      {isActive && (
        <span className="sr-only">
          (current page)
        </span>
      )}
    </Link>
  );
});

// Main component with performance optimizations
export const MobileTabs = memo(function MobileTabs() {
  const pathname = usePathname();
  const { session } = useAuth();
  // const { pending } = useLinkStatus(); // Removed due to hooks order issues

  // Prefetch management for performance - hooks must be called before any conditional returns
  const handleHoverStart = useCallback(() => {
    // Prefetch logic can be added here if needed
  }, []);

  const handleHoverEnd = useCallback(() => {
    // Cleanup prefetch logic if needed
  }, []);

  // Only show tabs if user is authenticated (performance optimization)
  if (!session) {
    return null;
  }

  // Check if any navigation is pending - temporarily set to false
  const isNavigationPending = false;

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t"
    >
      <div className="flex justify-around py-1 pb-1 safe-area-inset-bottom">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <TabItem
              key={tab.href}
              tab={tab}
              isActive={isActive}
              isPending={isNavigationPending}
              onHoverStart={handleHoverStart}
              onHoverEnd={handleHoverEnd}
            />
          );
        })}
      </div>
    </nav>
  );
});

// Display name for debugging
MobileTabs.displayName = "MobileTabs";
