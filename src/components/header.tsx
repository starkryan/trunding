"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  TrendingUp, 
  BarChart3, 
  User, 
  PieChart,
  Wallet,
  Menu
} from "lucide-react";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();

  const getPageTitle = () => {
    switch (pathname) {
      case "/home":
        return "Home";
      case "/market":
        return "Market";
      case "/trade":
        return "Trade";
      case "/portfolio":
        return "Portfolio";
      case "/wallet":
        return "Wallet";
      case "/profile":
        return "Profile";
      default:
        return "Montra";
    }
  };

  const getPageIcon = () => {
    switch (pathname) {
      case "/home":
        return <Home className="h-5 w-5" />;
      case "/market":
        return <TrendingUp className="h-5 w-5" />;
      case "/trade":
        return <BarChart3 className="h-5 w-5" />;
      case "/portfolio":
        return <PieChart className="h-5 w-5" />;
      case "/wallet":
        return <Wallet className="h-5 w-5" />;
      case "/profile":
        return <User className="h-5 w-5" />;
      default:
        return <Home className="h-5 w-5" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="sm"
          className="mr-2 md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Page title and icon */}
        <div className="flex items-center space-x-2">
          {getPageIcon()}
          <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Spacer */}
        <div className="flex-1" />
      </div>
    </header>
  );
}
