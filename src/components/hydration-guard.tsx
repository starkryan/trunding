"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";

export default function HydrationGuard({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner variant="bars" size={32} className="text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
