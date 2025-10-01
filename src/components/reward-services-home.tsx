"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Gift,
  Calculator,
  TrendingUp,
  DollarSign,
  IndianRupee,
  FunctionSquare,
  Percent,
  Target,
  CheckCircle,
  XCircle,
  Coins,
  BarChart3,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RewardService {
  id: string;
  name: string;
  description: string;
  formula: string;
  formulaDisplay: string;
  exampleAmount: number;
  exampleReward: number;
  exampleQuota: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function RewardServicesHome() {
  const [services, setServices] = useState<RewardService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/reward-services');
      if (response.ok) {
        const data = await response.json();
        // The API already returns only active services
        setServices(data);
      } else {
        setError('Failed to load reward services');
      }
    } catch (error) {
      console.error('Failed to load services:', error);
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Gift className="h-6 w-6" />
              Reward Services
            </h2>
            <p className="text-muted-foreground">
              Available reward calculation services
            </p>
          </div>
        </div>
        <div className="flex justify-center py-12">
          <Spinner variant="bars" size={24} className="text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Gift className="h-6 w-6" />
              Reward Services
            </h2>
            
          </div>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          <p>Unable to load reward services</p>
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Gift className="h-6 w-6" />
              Reward Services
            </h2>
            <p className="text-muted-foreground">
              Available reward calculation services
            </p>
          </div>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          <Gift className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p>No active reward services available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="h-6 w-6" />
            Reward Services
          </h2>
          <p className="text-muted-foreground">
            Available reward calculation services
          </p>
        </div>
        <Badge variant="default" className="flex items-center gap-1">
          {services.length} Active
        </Badge>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <div key={service.id} className="relative overflow-hidden rounded-xl border bg-card/50 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10"></div>
            <div className="relative z-10 p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Gift className="h-5 w-5 text-primary" />
                    {service.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {service.description}
                  </p>
                </div>
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Active
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="text-sm">
                  <span className="font-medium flex items-center gap-2 mb-1">
                    <FunctionSquare className="h-4 w-4" />
                    Formula:
                  </span>
                  <div className="font-mono bg-muted/50 px-2 py-1 rounded text-xs mt-1">
                    {service.formulaDisplay}
                  </div>
                </div>
              </div>

              <div className="border-t border-border/50 pt-3">
                <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Example:
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <IndianRupee className="h-3 w-3" />
                      Amount:
                    </span>
                    <span className="font-medium">{formatCurrency(service.exampleAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <Coins className="h-3 w-3 text-green-600" />
                      Reward:
                    </span>
                    <span className="font-medium text-green-600">{formatCurrency(service.exampleReward)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="h-3 w-3 text-blue-600" />
                      Quota:
                    </span>
                    <span className="font-medium text-blue-600">{formatCurrency(service.exampleQuota)}</span>
                  </div>
                </div>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  // Navigate to trade or reward services page
                  window.location.href = '/trade';
                }}
              >
                Start Trading
                <ArrowUpRight className="ml-2 h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
