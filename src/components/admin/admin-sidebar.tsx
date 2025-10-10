"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Settings,
  Shield,
  BarChart3,
  Database,
  FileText,
  Bell,
  Search,
  Activity,
  CreditCard,
  ShieldCheck,
  Server,
  FileBarChart,
  Settings2,
  Home,
  UserCircle,
  DollarSign,
  PieChart,
  LineChart,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart2,
  Calendar,
  Download,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Heart,
  Star,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Gift
} from "lucide-react";

const adminNavItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    description: "Overview and analytics"
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
    description: "Manage user accounts"
  },
  {
    title: "Transactions",
    href: "/admin/transactions",
    icon: CreditCard,
    description: "Payment transactions"
  },
  {
    title: "Withdrawal Requests",
    href: "/admin/withdrawal-requests",
    icon: DollarSign,
    description: "Process withdrawal requests"
  },
  {
    title: "Reward Services",
    href: "/admin/reward-services",
    icon: Gift,
    description: "Manage reward calculation services"
  },
    {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    description: "Platform analytics"
  },
  {
    title: "Security",
    href: "/admin/security",
    icon: ShieldCheck,
    description: "Security settings"
  },
  {
    title: "Database",
    href: "/admin/database",
    icon: Server,
    description: "Database management"
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: FileBarChart,
    description: "System reports"
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings2,
    description: "Platform settings"
  },
];

export default function AdminSidebar({ isOpen, onToggle, isCollapsed }: { isOpen: boolean; onToggle: () => void; isCollapsed?: boolean }) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Always show on desktop, only conditionally hide on mobile
  if (isMobile && !isOpen) {
    return null;
  }

  // Don't completely hide when collapsed - show icon-only version

  return (
    <div className={cn(
      "bg-background border-r border-border flex flex-col transition-all duration-300 ease-in-out",
      isMobile
        ? "fixed inset-y-0 left-0 z-50 w-64 shadow-lg"
        : isCollapsed
        ? "relative w-16 flex-shrink-0" // Desktop collapsed: icon-only width
        : "relative w-64 flex-shrink-0" // Desktop expanded: full width
    )}>
      <div className={cn(
        "p-4 border-b border-border flex items-center justify-between",
        isCollapsed && !isMobile ? "justify-center" : ""
      )}>
        <div className={cn(
          "flex items-center gap-3",
          isCollapsed && !isMobile ? "justify-center" : ""
        )}>
          <div className={cn(
            "bg-primary rounded-lg flex items-center justify-center",
            isCollapsed && !isMobile ? "w-10 h-10" : "w-8 h-8"
          )}>
            <LayoutDashboard className={cn(
              "text-primary-foreground",
              isCollapsed && !isMobile ? "h-6 w-6" : "h-5 w-5"
            )} />
          </div>
          {(!isCollapsed || isMobile) && (
            <div>
              <h1 className="text-lg font-bold text-foreground">Montra Admin</h1>
              <p className="text-xs text-muted-foreground">Investment Platform</p>
            </div>
          )}
        </div>
        {isMobile && (
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg transition-colors group",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:translate-x-1",
                  isCollapsed && !isMobile
                    ? "justify-center px-2 py-2"
                    : "gap-3 px-3 py-2 text-sm font-medium"
                )}
                title={isCollapsed && !isMobile ? item.title : undefined}
              >
                <item.icon className={cn(
                  "transition-transform group-hover:scale-110",
                  isCollapsed && !isMobile
                    ? "h-6 w-6"
                    : "h-5 w-5",
                  isActive ? "text-primary-foreground" : "text-muted-foreground"
                )} />
                {(!isCollapsed || isMobile) && (
                  <div className="flex flex-col">
                    <span className="font-medium">{item.title}</span>
                    <span className="text-xs opacity-70">{item.description}</span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className={cn(
        "p-4 border-t border-border",
        isCollapsed && !isMobile ? "items-center" : ""
      )}>
        <div className="space-y-2">
          <div className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground",
            isCollapsed && !isMobile ? "justify-center" : ""
          )}>
            <div className={cn(
              "bg-green-500 rounded-full animate-pulse",
              isCollapsed && !isMobile ? "w-3 h-3" : "w-2 h-2"
            )}></div>
            {(!isCollapsed || isMobile) && (
              <span>System Status: Online</span>
            )}
          </div>
          <Link
            href="/"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
              isCollapsed && !isMobile ? "justify-center" : ""
            )}
            title={isCollapsed && !isMobile ? "Back to App" : undefined}
          >
            <Home className={cn(
              isCollapsed && !isMobile ? "h-6 w-6" : "h-4 w-4"
            )} />
            {(!isCollapsed || isMobile) && (
              <span>Back to App</span>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}