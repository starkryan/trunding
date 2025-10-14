import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
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
  title: {
    default: process.env.NEXT_PUBLIC_APP_NAME || "Mintward",
    template: `%s | ${process.env.NEXT_PUBLIC_APP_NAME || "Mintward"}`,
  },
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Mintward - Investment Platform",
  keywords: ["Next.js", "React", "TypeScript", "Investment", "Platform"],
  authors: [{ name: process.env.NEXT_PUBLIC_APP_AUTHOR || "Mintward Team" }],
  creator: process.env.NEXT_PUBLIC_APP_AUTHOR || "Mintward Team",
  publisher: process.env.NEXT_PUBLIC_APP_NAME || "Mintward",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon-16x16.png",
  },
  manifest: "/site.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:3000",
    title: process.env.NEXT_PUBLIC_APP_NAME || "Mintward",
    description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Next.js app with better-auth integration",
    siteName: process.env.NEXT_PUBLIC_APP_NAME || "Mintward",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${process.env.NEXT_PUBLIC_APP_NAME || "Mintward"} Logo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: process.env.NEXT_PUBLIC_APP_NAME || "Mintward",
    description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Next.js app with better-auth integration",
    images: ["/og-image.png"],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || "",
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || "",
    yahoo: process.env.NEXT_PUBLIC_YAHOO_VERIFICATION || "",
  },
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
              {children}
              <Toaster
                position="top-center"
                duration={4000}
                visibleToasts={5}
                richColors={false}
                closeButton={true}
                expand={true}
                icons={{
                  success: <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs">✓</div>,
                  error: <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">✕</div>,
                  warning: <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs">!</div>,
                  info: <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">i</div>,
                  loading: <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>,
                }}
                toastOptions={{
                  className: "border-border bg-background text-foreground",
                  descriptionClassName: "text-muted-foreground",
                }}
              />
            </HydrationGuard>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
