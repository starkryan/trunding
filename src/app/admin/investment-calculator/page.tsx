"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calculator, IndianRupee, TrendingUp, DollarSign, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface InvestmentResult {
  amount: number;
  reward: number;
  quota: number;
}

export default function InvestmentCalculatorPage() {
  const [investmentAmount, setInvestmentAmount] = useState<string>("");
  const [results, setResults] = useState<InvestmentResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  const calculateInvestment = (amount: number): InvestmentResult => {
    const reward = (amount * 0.03) + 6;
    const quota = amount + reward;
    return { amount, reward, quota };
  };

  const handleCalculate = () => {
    if (!investmentAmount) return;

    setIsCalculating(true);

    // Simulate calculation delay for better UX
    setTimeout(() => {
      const amount = parseFloat(investmentAmount);
      const calculation = calculateInvestment(amount);
      setResults(calculation);
      setIsCalculating(false);
    }, 300);
  };

  const handleReset = () => {
    setInvestmentAmount("");
    setResults(null);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const exampleCalculations = [
    { amount: 1500, reward: 51, quota: 1551 },
    { amount: 5000, reward: 156, quota: 5156 },
    { amount: 10000, reward: 306, quota: 10306 },
    { amount: 25000, reward: 756, quota: 25756 },
    { amount: 50000, reward: 1506, quota: 51506 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investment Calculator</h1>
          <p className="text-muted-foreground">
            Calculate investment rewards and quotas using the formula: Reward = (Amount × 3%) + 6
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Calculator className="h-4 w-4" />
            Admin Tool
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Calculator Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Calculate Investment
            </CardTitle>
            <CardDescription>
              Enter an investment amount to calculate the reward and quota
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Investment Amount (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter investment amount"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  className="pl-10"
                  min="1"
                  step="1"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCalculate}
                disabled={!investmentAmount || isCalculating}
                className="flex-1"
              >
                {isCalculating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Calculate
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
            </div>

            {/* Results */}
            {results && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="text-center">
                    <Label className="text-sm text-muted-foreground">Investment Amount</Label>
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(results.amount)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Reward</span>
                      </div>
                      <div className="text-xl font-bold text-green-800">
                        {formatCurrency(results.reward)}
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        ({results.amount} × 3%) + 6
                      </div>
                    </div>

                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Quota</span>
                      </div>
                      <div className="text-xl font-bold text-blue-800">
                        {formatCurrency(results.quota)}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        {results.amount} + {results.reward}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Formula & Examples Card */}
        <Card>
          <CardHeader>
            <CardTitle>Formula & Examples</CardTitle>
            <CardDescription>
              Investment calculation formula and sample calculations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Calculation Formula</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-mono bg-background px-2 py-1 rounded">Reward = (Amount × 3%) + 6</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono bg-background px-2 py-1 rounded">Quota = Amount + Reward</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Example Calculations</h4>
              <div className="space-y-3">
                {exampleCalculations.map((example, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-colors",
                      "hover:bg-muted/50"
                    )}
                    onClick={() => {
                      setInvestmentAmount(example.amount.toString());
                      setResults(calculateInvestment(example.amount));
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{formatCurrency(example.amount)}</span>
                      <div className="text-right text-sm">
                        <div className="text-green-600">Reward: {formatCurrency(example.reward)}</div>
                        <div className="text-blue-600">Quota: {formatCurrency(example.quota)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">How to Use</h4>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Enter investment amount in rupees</li>
                <li>Click Calculate to see reward and quota</li>
                <li>Click on examples to pre-fill values</li>
                <li>Results show both individual and total amounts</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Calculations */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Current Calculation Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Investment Amount</div>
                <div className="text-2xl font-bold">{formatCurrency(results.amount)}</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Reward (3% + ₹6)</div>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(results.reward)}</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Total Quota</div>
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(results.quota)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}