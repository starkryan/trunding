"use client";

import AdminSidebar from "@/components/admin/admin-sidebar";
import AdminHeader from "@/components/admin/admin-header";
import { useState } from "react";
import { cn } from "@/lib/utils";

function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <AdminSidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} isCollapsed={isSidebarCollapsed} />

      <div className={cn(
        "flex-1 overflow-hidden transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "lg:ml-0" : "lg:ml-0"
      )}>
        <AdminHeader onMenuClick={toggleSidebar} onSidebarCollapse={toggleSidebarCollapse} isSidebarCollapsed={isSidebarCollapsed} />
        <main className="p-4 lg:p-6 overflow-y-auto h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>;
}