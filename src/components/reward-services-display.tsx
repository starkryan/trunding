"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Gift,
  Calculator,
  TrendingUp,
  DollarSign,
  IndianRupee,
  ExternalLink,
  Play
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

interface RewardServicesDisplayProps {
  className?: string;
}

export default function RewardServicesDisplay({ className }: RewardServicesDisplayProps) {
  const [services, setServices] = useState<RewardService[]>([]);
  const [selectedService, setSelectedService] = useState<RewardService | null>(null);
  const [calculationAmount, setCalculationAmount] = useState<number>(1000);
  const [calculationResult, setCalculationResult] = useState<{
    reward: number;
    quota: number;
  } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await fetch('/api/reward-services');
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Failed to load services:', error);
    }
  };

  const calculateReward = (amount: number, formula: string): { reward: number; quota: number } => {
    try {
      // Simple formula evaluation (in production, use a proper formula parser)
      const reward = eval(formula.replace(/amount/g, amount.toString()));
      const quota = amount + reward;
      return { reward: Number(reward.toFixed(2)), quota: Number(quota.toFixed(2)) };
    } catch (error) {
      return { reward: 0, quota: amount };
    }
  };

  const handleCalculate = async (service: RewardService) => {
    setIsCalculating(true);
    try {
      const response = await fetch('/api/reward-services/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: service.id,
          amount: calculationAmount
        })
      });

      if (response.ok) {
        const result = await response.json();
        setCalculationResult({
          reward: result.reward,
          quota: result.quota
        });
      } else {
        // Fallback to client-side calculation
        const result = calculateReward(calculationAmount, service.formula);
        setCalculationResult(result);
      }
    } catch (error) {
      console.error('Failed to calculate reward:', error);
      // Fallback to client-side calculation
      const result = calculateReward(calculationAmount, service.formula);
      setCalculationResult(result);
    } finally {
      setIsCalculating(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const openCalculator = (service: RewardService) => {
    setSelectedService(service);
    setCalculationAmount(service.exampleAmount);
    setCalculationResult({
      reward: service.exampleReward,
      quota: service.exampleQuota
    });
  };

  if (services.length === 0) {
    return null; // Don't show anything if no active services
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Gift className="h-6 w-6 text-purple-600" />
            Reward Services
          </h2>
          <p className="text-muted-foreground">
            Calculate your investment rewards with our special services
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card key={service.id} className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-purple-200 dark:border-purple-800">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-600/10"></div>
            <CardHeader className="relative z-10">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Gift className="h-5 w-5 text-purple-600" />
                    {service.name}
                  </CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </div>
                <Badge variant="default" className="bg-purple-600">
                  Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Formula:</span>
                  <div className="font-mono bg-purple-50 dark:bg-purple-950/20 px-2 py-1 rounded text-xs mt-1">
                    {service.formulaDisplay}
                  </div>
                </div>
              </div>

              <div className="border-t border-purple-200 dark:border-purple-800 pt-3">
                <div className="text-sm text-muted-foreground mb-2">Example Calculation:</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-medium">{formatCurrency(service.exampleAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reward:</span>
                    <span className="font-medium text-green-600">{formatCurrency(service.exampleReward)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quota:</span>
                    <span className="font-medium text-blue-600">{formatCurrency(service.exampleQuota)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                      onClick={() => openCalculator(service)}
                    >
                      <Calculator className="mr-2 h-4 w-4" />
                      Calculate
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Gift className="h-5 w-5 text-purple-600" />
                        {service.name} Calculator
                      </DialogTitle>
                      <DialogDescription>
                        Calculate your reward based on the investment amount
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Investment Amount (₹)</Label>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="amount"
                            type="number"
                            value={calculationAmount}
                            onChange={(e) => setCalculationAmount(Number(e.target.value))}
                            className="pl-10"
                            min="1"
                            step="1"
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm space-y-1">
                          <div>Formula: {service.formulaDisplay}</div>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleCalculate(service)}
                        disabled={isCalculating}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        {isCalculating ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Calculating...
                          </>
                        ) : (
                          <>
                            <Calculator className="mr-2 h-4 w-4" />
                            Calculate Reward
                          </>
                        )}
                      </Button>

                      {calculationResult && (
                        <div className="border-t pt-4 space-y-3">
                          <div className="text-center">
                            <div className="text-sm text-muted-foreground">Investment Amount</div>
                            <div className="text-2xl font-bold text-purple-600">
                              {formatCurrency(calculationAmount)}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <TrendingUp className="h-3 w-3 text-green-600" />
                                <span className="text-xs font-medium text-green-700 dark:text-green-400">Reward</span>
                              </div>
                              <div className="text-lg font-bold text-green-800 dark:text-green-400">
                                {formatCurrency(calculationResult.reward)}
                              </div>
                            </div>

                            <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <DollarSign className="h-3 w-3 text-blue-600" />
                                <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Quota</span>
                              </div>
                              <div className="text-lg font-bold text-blue-800 dark:text-blue-400">
                                {formatCurrency(calculationResult.quota)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setSelectedService(null);
                        setCalculationResult(null);
                      }}>
                        Close
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {services.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Gift className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Active Reward Services</h3>
            <p className="text-muted-foreground text-center">
              Check back later for available reward services
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}