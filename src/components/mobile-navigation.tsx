"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  FaHome,
  FaChartLine,
  FaExchangeAlt,
  FaUser,
  FaBell,
  FaSearch,
  FaCreditCard,
} from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Route = `/home` | `/market` | `/transactions` | `/profile`;

interface NavigationItem {
  href: Route;
  label: string;
  icon: React.ReactNode;
  "aria-label": string;
}

const navigationItems: NavigationItem[] = [
  {
    href: "/home",
    label: "Home",
    icon: <FaHome className="h-5 w-5" />,
    "aria-label": "Navigate to home",
  },
  {
    href: "/market",
    label: "Market",
    icon: <FaChartLine className="h-5 w-5" />,
    "aria-label": "Navigate to market overview",
  },
  {
    href: "/transactions",
    label: "Transactions",
    icon: <FaExchangeAlt className="h-5 w-5" />,
    "aria-label": "Navigate to transaction history",
  },
  {
    href: "/profile",
    label: "Profile",
    icon: <FaUser className="h-5 w-5" />,
    "aria-label": "Navigate to user profile",
  },
];

export function MobileTopBar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/50 md:hidden">
      <div className="flex items-center justify-between px-4 py-2 h-[64px]">
        {/* Logo/Title */}
        <div className="flex items-center space-x-3">
          <div className="relative w-8 h-8">
            <Image
              src="/logo.png"
              alt="Montra Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-lg font-bold">Montra</h1>
        </div>
      </div>
    </div>
  );
}

export function MobileBottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t md:hidden">
      <div className="flex items-center justify-around py-3">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Button
              key={item.href}
              variant="ghost"
              className={cn(
                "flex flex-col items-center space-y-1 h-auto py-2 px-2 min-w-[48px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              )}
              onClick={() => router.push(item.href)}
            >
              <div className={cn(
                "flex items-center justify-center w-5 h-5",
                isActive && "text-primary"
              )}>
                {item.icon}
              </div>
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export default function MobileNavigation() {
  return (
    <>
      <MobileTopBar />
      <MobileBottomNavigation />
    </>
  );
}
