"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";

interface ContactSettings {
  contactMethod: "TELEGRAM" | "WHATSAPP" | "EMAIL" | "PHONE" | "CUSTOM";
  url: string | null;
  appUrl: string | null;
  contactValue: string | null;
  buttonText: string;
  buttonColor: string;
  buttonSize: "SMALL" | "MEDIUM" | "LARGE";
  positionBottom: string;
  positionRight: string;
  positionBottomMd: string;
  positionRightMd: string;
  iconName: string;
  isEnabled: boolean;
  openInNewTab: boolean;
  customStyles: any;
}

// Default settings as fallback
const defaultSettings: ContactSettings = {
  contactMethod: "TELEGRAM",
  url: "https://t.me/mintward",
  appUrl: "tg://resolve?domain=mintward",
  contactValue: "mintward",
  buttonText: "Help & Support",
  buttonColor: "primary",
  buttonSize: "MEDIUM",
  positionBottom: "bottom-24",
  positionRight: "right-4",
  positionBottomMd: "bottom-20",
  positionRightMd: "right-6",
  iconName: "HeadsetIcon",
  isEnabled: true,
  openInNewTab: true,
  customStyles: null
};

export default function FloatingContactButton() {
  const [settings, setSettings] = useState<ContactSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [isClicked, setIsClicked] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/contact-settings');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Failed to load contact settings:', error);
      // Keep using default settings on error
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.HelpCircle;
    return IconComponent;
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'SMALL': return 'h-10 w-10';
      case 'MEDIUM': return 'h-14 w-14';
      case 'LARGE': return 'h-16 w-16';
      default: return 'h-14 w-14';
    }
  };

  const handleContactClick = () => {
    if (!settings.isEnabled) return;

    setIsClicked(true);

    try {
      let finalUrl = settings.url || "";
      let appUrl = settings.appUrl || "";

      // Handle different contact methods
      switch (settings.contactMethod) {
        case "TELEGRAM":
          if (settings.contactValue && settings.contactValue.trim()) {
            // Use the URL from settings (which should be properly generated)
            finalUrl = settings.url || `https://t.me/${settings.contactValue.trim().replace('@', '')}`;
            appUrl = settings.appUrl || `tg://resolve?domain=${settings.contactValue.trim().replace('@', '')}`;
          } else {
            // Fallback to default
            finalUrl = settings.url || "https://t.me/mintward_support";
            appUrl = settings.appUrl || "tg://resolve?domain=mintward_support";
          }
          break;
        
        case "WHATSAPP":
          if (settings.contactValue) {
            const phoneNumber = settings.contactValue.replace(/[^\d]/g, '');
            finalUrl = `https://wa.me/${phoneNumber}`;
            appUrl = `whatsapp://send?phone=${phoneNumber}`;
          }
          break;
        
        case "EMAIL":
          if (settings.contactValue) {
            finalUrl = `mailto:${settings.contactValue}`;
          }
          break;
        
        case "PHONE":
          if (settings.contactValue) {
            const phoneNumber = settings.contactValue.replace(/[^\d]/g, '');
            finalUrl = `tel:${phoneNumber}`;
          }
          break;
        
        case "CUSTOM":
          finalUrl = settings.url || "";
          appUrl = "";
          break;
      }

      // Try to open in app first if appUrl exists
      if (appUrl && finalUrl) {
        const link = document.createElement('a');
        link.href = appUrl;
        link.target = settings.openInNewTab ? '_blank' : '_self';
        link.rel = 'noopener noreferrer';

        // Set a timeout to fallback to web URL
        const timeout = setTimeout(() => {
          if (finalUrl) {
            window.open(finalUrl, settings.openInNewTab ? '_blank' : '_self', 'noopener,noreferrer');
          }
        }, 1000);

        // Listen for the app opening
        link.addEventListener('click', () => {
          clearTimeout(timeout);
        });

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (finalUrl) {
        // Open directly in web if no app URL
        window.open(finalUrl, settings.openInNewTab ? '_blank' : '_self', 'noopener,noreferrer');
      }

      // Show success message
      const contactMethod = settings.contactMethod.toLowerCase();
      toast.success(`Opening ${contactMethod} contact...`, {
        duration: 2000,
      });

    } catch (error) {
      console.error('Error opening contact:', error);
      toast.error("Failed to open contact. Please try again.", {
        duration: 3000,
      });
    }

    // Reset button state
    setTimeout(() => setIsClicked(false), 2000);
  };

  // Don't render if loading or button is disabled
  if (loading || !settings.isEnabled) {
    return null;
  }

  const IconComponent = getIconComponent(settings.iconName);
  const sizeClasses = getSizeClasses(settings.buttonSize);

  return (
    <div className={`fixed ${settings.positionBottom} ${settings.positionRight} z-40 md:${settings.positionBottomMd} md:${settings.positionRightMd}`}>
      {/* Main Button */}
      <Button
        size="lg"
        className={cn(
          sizeClasses,
          "rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 bg-primary hover:bg-primary/90 text-primary-foreground border-2 border-primary/20 relative group",
          isClicked ? 'scale-95' : ''
        )}
        onClick={handleContactClick}
        aria-label={settings.buttonText}
        disabled={isClicked}
      >
        <IconComponent className={`h-6 w-6 transition-transform duration-300 group-hover:scale-110 ${
          isClicked ? 'animate-bounce' : ''
        }`} />

        {/* Pulse Animation */}
        <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></span>

        {/* Notification Dot */}
        <span className="absolute top-1 right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background animate-pulse"></span>

        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-foreground text-background text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          {settings.buttonText}
          <div className="absolute top-full right-0 mt-1 w-2 h-2 bg-foreground rotate-45 transform translate-x-1/2"></div>
        </div>
      </Button>
    </div>
  );
}