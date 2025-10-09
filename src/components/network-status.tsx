"use client";

import { useNetworkState } from 'react-use';
import { useState, useEffect } from 'react';
import { FaWifi, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function NetworkStatus() {
  const networkState = useNetworkState();
  const [showStatus, setShowStatus] = useState(false);
  const [previousOnline, setPreviousOnline] = useState(true);

  useEffect(() => {
    // Show network status changes as toast notifications
    if (networkState.online !== undefined && previousOnline !== networkState.online) {
      if (networkState.online) {
        toast.success('Connection restored!', {
          icon: '🟢',
          duration: 3000,
        });
      } else {
        toast.error('Connection lost. Some features may be unavailable.', {
          icon: '🔴',
          duration: 5000,
        });
      }
      setPreviousOnline(networkState.online);
    }
  }, [networkState.online, previousOnline]);

  // Don't show anything if network state is not available
  if (networkState.online === undefined) {
    return null;
  }

  const getConnectionColor = () => {
    if (!networkState.online) return 'text-red-500';
    if (networkState.effectiveType === 'slow-2g' || networkState.effectiveType === '2g') return 'text-yellow-500';
    return 'text-green-500';
  };

  const getConnectionText = () => {
    if (!networkState.online) return 'Offline';
    if (networkState.effectiveType) {
      const typeMap = {
        'slow-2g': 'Very Slow',
        '2g': 'Slow',
        '3g': 'Good',
        '4g': 'Fast',
      };
      return typeMap[networkState.effectiveType] || 'Connected';
    }
    return 'Connected';
  };

  const getConnectionIcon = () => {
    if (!networkState.online) return FaExclamationTriangle;
    if (networkState.effectiveType === 'slow-2g' || networkState.effectiveType === '2g') return FaExclamationTriangle;
    return FaWifi;
  };

  const Icon = getConnectionIcon();

  return (
    <div className="fixed top-4 left-4 z-50">
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border bg-background/95 backdrop-blur-sm shadow-lg transition-all duration-300 ${getConnectionColor()} border-current/20`}
        onMouseEnter={() => setShowStatus(true)}
        onMouseLeave={() => setShowStatus(false)}
      >
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium">{getConnectionText()}</span>

        {showStatus && (
          <div className="absolute top-full left-0 mt-2 p-3 bg-background border rounded-lg shadow-xl min-w-48 border-border">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className={networkState.online ? 'text-green-600' : 'text-red-600'}>
                  {networkState.online ? 'Online' : 'Offline'}
                </span>
              </div>

              {networkState.effectiveType && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Connection:</span>
                  <span className="capitalize">{networkState.effectiveType}</span>
                </div>
              )}

              {networkState.downlink && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Speed:</span>
                  <span>{networkState.downlink} Mbps</span>
                </div>
              )}

              {networkState.rtt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Latency:</span>
                  <span>{networkState.rtt} ms</span>
                </div>
              )}

              {networkState.type && networkState.type !== 'unknown' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="capitalize">{networkState.type}</span>
                </div>
              )}

              {networkState.saveData !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data Saver:</span>
                  <span>{networkState.saveData ? 'On' : 'Off'}</span>
                </div>
              )}

              {networkState.since && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Since:</span>
                  <span>{networkState.since.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}