"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { 
  Home, 
  TrendingUp, 
  BarChart3, 
  User, 
  PieChart,
  Wallet,
  HomeIcon,
  TrendingUpIcon,
  BarChart3Icon,
  UserIcon,
  PieChartIcon,
  WalletIcon
} from "lucide-react";

interface TabItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
}

const tabs: TabItem[] = [
  {
    href: "/home",
    label: "Home",
    icon: <HomeIcon className="h-5 w-5" />,
    activeIcon: <Home className="h-5 w-5" />,
  },
  {
    href: "/market",
    label: "Market",
    icon: <TrendingUpIcon className="h-5 w-5" />,
    activeIcon: <TrendingUp className="h-5 w-5" />,
  },
  {
    href: "/trade",
    label: "Trade",
    icon: <BarChart3Icon className="h-5 w-5" />,
    activeIcon: <BarChart3 className="h-5 w-5" />,
  },
  {
    href: "/wallet",
    label: "Wallet",
    icon: <WalletIcon className="h-5 w-5" />,
    activeIcon: <Wallet className="h-5 w-5" />,
  },
  {
    href: "/portfolio",
    label: "Portfolio",
    icon: <PieChartIcon className="h-5 w-5" />,
    activeIcon: <PieChart className="h-5 w-5" />,
  },
  {
    href: "/profile",
    label: "Profile",
    icon: <UserIcon className="h-5 w-5" />,
    activeIcon: <User className="h-5 w-5" />,
  },
];

export function MobileTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const { session } = useAuth();

  // Only show tabs if user is authenticated
  if (!session) {
    return null;
  }

  const handleTabClick = (href: string) => {
    router.push(href);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <div className="flex justify-around py-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <button
              key={tab.href}
              onClick={() => handleTabClick(tab.href)}
              className={cn(
                "flex flex-col items-center justify-center min-w-[60px] py-1 px-2 rounded-lg transition-colors",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {isActive ? tab.activeIcon : tab.icon}
              <span className={cn(
                "text-xs mt-1",
                isActive ? "font-medium" : "font-normal"
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
