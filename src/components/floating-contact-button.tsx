"use client";

import { useState, useEffect } from "react";
import { FaHeadset, FaTelegram } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function FloatingContactButton() {
  const [isClicked, setIsClicked] = useState(false);

  const handleContactClick = () => {
    setIsClicked(true);

    // Open Telegram contact
    const telegramUrl = "https://t.me/mintward_support";

    // Try to open in app first, then fallback to web
    const appUrl = `tg://resolve?domain=mintward_support`;

    // First try to open in Telegram app
    const link = document.createElement('a');
    link.href = appUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    // Set a timeout to fallback to web URL
    const timeout = setTimeout(() => {
      window.open(telegramUrl, '_blank', 'noopener,noreferrer');
    }, 1000);

    // Listen for the app opening
    link.addEventListener('click', () => {
      clearTimeout(timeout);
    });

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Show success message
    toast.success("Opening Telegram support...", {
      duration: 2000,
    });

    // Reset button state
    setTimeout(() => setIsClicked(false), 2000);
  };

  return (
    <div className="fixed bottom-24 right-4 z-40 md:bottom-20 md:right-6">
      {/* Main Button */}
      <Button
        size="lg"
        className={`h-14 w-14 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 bg-primary hover:bg-primary/90 text-primary-foreground border-2 border-primary/20 relative group ${
          isClicked ? 'scale-95' : ''
        }`}
        onClick={handleContactClick}
        aria-label="Contact Support on Telegram"
        disabled={isClicked}
      >
        <FaHeadset className={`h-6 w-6 transition-transform duration-300 group-hover:scale-110 ${
          isClicked ? 'animate-bounce' : ''
        }`} />

        {/* Pulse Animation */}
        <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></span>

        {/* Notification Dot */}
        <span className="absolute top-1 right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background animate-pulse"></span>

        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-foreground text-background text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          Help & Support
          <div className="absolute top-full right-0 mt-1 w-2 h-2 bg-foreground rotate-45 transform translate-x-1/2"></div>
        </div>
      </Button>
    </div>
  );
}