import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { MobileTabs } from "@/components/mobile-tabs";
import { AuthenticatedHeader } from "@/components/authenticated-header";
import HydrationGuard from "@/components/hydration-guard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Montra - Authentication Demo",
  description: "Next.js app with better-auth integration",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <HydrationGuard>
              <AuthenticatedHeader />
              {children}
              <MobileTabs />
              <Toaster />
            </HydrationGuard>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
