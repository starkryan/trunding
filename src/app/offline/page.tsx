"use client";

import { FaWifi, FaHome } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNetworkState } from 'react-use';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function OfflinePage() {
  const networkState = useNetworkState();
  const router = useRouter();

  const handleRetry = () => {
    if (networkState.online) {
      router.push('/');
      router.refresh();
    } else {
      // Show a message that connection is still offline
      alert('Still offline. Please check your internet connection and try again.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <Image
              src="/logo.png"
              alt="App Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground">You're Offline</h1>
          <p className="text-muted-foreground mt-2">
            {networkState.online
              ? "Connection restored! You can go back online."
              : "Please check your internet connection and try again."
            }
          </p>
        </div>

        {/* Offline Card */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <FaWifi className={`h-8 w-8 ${networkState.online ? 'text-green-500' : 'text-red-500'}`} />
            </div>
            <CardTitle className="text-xl">
              {networkState.online ? 'Connection Restored!' : 'No Internet Connection'}
            </CardTitle>
            <CardDescription>
              {networkState.online
                ? "Your internet connection is back to normal."
                : "Some features may be unavailable until you're back online."
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Connection Details */}
            {networkState.effectiveType && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Connection Type:</span>
                  <span className="font-medium capitalize">{networkState.effectiveType}</span>
                </div>
                {networkState.downlink && (
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-muted-foreground">Speed:</span>
                    <span className="font-medium">{networkState.downlink} Mbps</span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                onClick={handleRetry}
                className="w-full"
                disabled={!networkState.online}
              >
                {networkState.online ? 'Go Back Online' : 'Retry Connection'}
              </Button>

              <Link href="/" passHref>
                <Button variant="outline" className="w-full">
                  <FaHome className="mr-2 h-4 w-4" />
                  Go to Homepage
                </Button>
              </Link>
            </div>

            {/* Tips */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>💡 <strong>Tips:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Check your WiFi or mobile data connection</li>
                <li>Try moving to a location with better signal</li>
                <li>Restart your router if you're using WiFi</li>
                <li>Cached content may still be available</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>This app works offline with limited functionality.</p>
          <p>Your data will sync when connection is restored.</p>
        </div>
      </div>
    </div>
  );
}