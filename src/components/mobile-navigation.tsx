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
  FaWallet,
} from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";

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
    icon: <FaHome className="!size-5" style={{ width: '20px', height: '20px' }} />,
    "aria-label": "Navigate to home",
  },
  {
    href: "/market",
    label: "Market",
    icon: <FaChartLine className="!size-5" style={{ width: '20px', height: '20px' }} />,
    "aria-label": "Navigate to market overview",
  },
  {
    href: "/transactions",
    label: "Transactions",
    icon: <FaExchangeAlt className="!size-5" style={{ width: '20px', height: '20px' }} />,
    "aria-label": "Navigate to transaction history",
  },
  {
    href: "/profile",
    label: "Profile",
    icon: <FaUser className="!size-5" style={{ width: '20px', height: '20px' }} />,
    "aria-label": "Navigate to user profile",
  },
];

export function MobileTopBar() {
  const { session } = useAuth();
  const { balance, formatBalance, loading: walletLoading } = useWallet();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border md:hidden">
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

        {/* Balance Display - Only show for authenticated users */}
        {session && (
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <FaWallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className={cn(
              "font-semibold text-emerald-700 dark:text-emerald-300 text-sm",
              walletLoading && "animate-pulse"
            )}>
              {walletLoading ? "₹..." : formatBalance(balance)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function MobileBottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
      <div className="flex items-center justify-around py-3">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Button
              key={item.href}
              variant="ghost"
              className={cn(
                "flex flex-col items-center space-y-1 h-auto py-3 px-3 min-w-[44px]",
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
