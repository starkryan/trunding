"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import { FaArrowLeft, FaChevronLeft, FaBell, FaSearch, FaEllipsisV, FaTimes, FaHome } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { memo, useCallback } from "react";
import Link from "next/link";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  backHref?: string;
  showActions?: boolean;
  showHome?: boolean;
  centerTitle?: boolean;
  actions?: React.ReactNode;
  onBack?: () => void;
  transparent?: boolean;
}

export const Header = memo(function Header({
  title,
  subtitle,
  showBack = false,
  backHref,
  showActions = true,
  showHome = false,
  centerTitle = true,
  actions,
  onBack,
  transparent = false
}: HeaderProps) {
  const pathname = usePathname();
  const { session } = useAuth();

  // Get page title from pathname if not provided
  const getPageTitle = useCallback(() => {
    if (title) return title;

    const pathSegments = pathname.split('/').filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];

    if (!lastSegment || lastSegment === 'home') return 'Montra';

    // Capitalize first letter and replace hyphens with spaces
    return lastSegment
      .charAt(0).toUpperCase() + lastSegment.slice(1)
      .replace(/-/g, ' ');
  }, [pathname, title]);

  const pageTitle = getPageTitle();

  // Get user initials for avatar fallback
  const getUserInitials = useCallback((name: string) => {
    return name
      .split(" ")
      .map(word => word.charAt(0).toUpperCase())
      .join("")
      .substring(0, 2);
  }, []);

  const userInitials = session?.user.name ? getUserInitials(session.user.name) : "U";

  return (
    <header className={cn(
      "sticky top-0 z-40 supports-[backdrop-filter]:bg-background/60 border-b transition-all duration-200",
      transparent
        ? "bg-transparent border-transparent"
        : "bg-background/95 backdrop-blur border-border/50"
    )}>
      {/* Status bar spacer for safe area */}
      <div className="h-6 bg-transparent md:hidden" />

      <div className="flex items-center justify-between px-4 py-3 h-[52px] md:h-[60px]">
        {/* Left Section */}
        <div className="flex items-center space-x-3">
          {/* Back Button - Native iOS style */}
          {showBack && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8 -ml-1 md:h-9 md:w-9"
              onClick={onBack}
              asChild={!onBack}
            >
              {onBack ? (
                <FaChevronLeft className="h-6 w-6 md:h-7 md:w-7" />
              ) : (
                <Link href={backHref || "/home"}>
                  <FaChevronLeft className="h-6 w-6 md:h-7 md:w-7" />
                </Link>
              )}
            </Button>
          )}

          {/* Page Title & Subtitle */}
          <div className="flex flex-col justify-center">
            <h1 className={cn(
              "font-semibold text-foreground leading-tight",
              subtitle ? "text-base md:text-lg" : "text-lg md:text-xl"
            )}>
              {pageTitle}
            </h1>
            {subtitle && (
              <p className="text-xs text-muted-foreground leading-tight md:text-sm">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right Section - Minimal actions */}
        {showActions && (
          <div className="flex items-center space-x-1">
            {/* Custom actions if provided */}
            {actions}

            {/* More Actions / Menu - Only if no custom actions */}
            {!actions && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-8 w-8 md:h-9 md:w-9"
              >
                <FaEllipsisV className="h-5 w-5 md:h-6 md:w-6" />
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  );
});

Header.displayName = "Header";
