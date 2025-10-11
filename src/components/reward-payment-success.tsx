"use client";

import { CheckCircle, TrendingUp, Gift, CreditCard, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface RewardPaymentSuccessProps {
  paymentId: string;
  serviceType: string;
  rewardServiceId: string;
  amount?: number;
  rewardAmount?: number;
  totalAmount?: number;
  serviceName?: string;
  onClose?: () => void;
}

export function RewardPaymentSuccess({
  paymentId,
  serviceType,
  rewardServiceId,
  amount,
  rewardAmount,
  totalAmount,
  serviceName,
  onClose
}: RewardPaymentSuccessProps) {

  const getServiceDisplayName = (type: string) => {
    switch (type) {
      case "reward_service_deposit":
        return "Reward Service Deposit";
      default:
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getServiceIdDisplay = (id: string) => {
    if (id.includes("starter")) return "Starter";
    if (id.includes("silver")) return "Silver";
    if (id.includes("gold")) return "Gold";
    if (id.includes("platinum")) return "Platinum";
    if (id.includes("diamond")) return "Diamond";
    if (id.includes("fixed")) return "Fixed Bonus";
    return id;
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Success Alert */}
      <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800 dark:text-green-200">
          <strong>Payment Successful!</strong> Your reward service deposit has been processed.
        </AlertDescription>
      </Alert>

      {/* Main Payment Card */}
      <Card className="border-2 border-green-200 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-green-800 dark:text-green-200">
              Payment Confirmed
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                <Gift className="h-3 w-3 mr-1" />
                Reward Service
              </Badge>
            </div>
          </div>
          <CardDescription className="text-base mt-2">
            {getServiceDisplayName(serviceType)} completed successfully
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Service Information */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Service</span>
              <span className="text-sm font-semibold">
                {serviceName || getServiceIdDisplay(rewardServiceId)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Service ID</span>
              <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                {rewardServiceId}
              </code>
            </div>
          </div>

          <Separator />

          {/* Payment Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Payment ID</span>
              <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                {paymentId}
              </code>
            </div>

            {amount !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Deposit Amount</span>
                <span className="text-sm font-semibold">
                  ₹{amount.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>
            )}

            {rewardAmount !== undefined && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Reward Bonus
                  </span>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm font-semibold text-green-600">
                  +₹{rewardAmount.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>
            )}

            {totalAmount !== undefined && (
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-base font-bold">Total Added</span>
                <span className="text-base font-bold text-green-600">
                  ₹{totalAmount.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Quick Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => window.location.href = '/reward-services'}
            >
              <Gift className="h-4 w-4 mr-2" />
              More Services
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => window.location.href = '/home'}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info Card */}
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-blue-800 dark:text-blue-200">
            <CreditCard className="h-4 w-4 mr-2 inline" />
            Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Payment Type</span>
              <p className="font-medium">{getServiceDisplayName(serviceType)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Status</span>
              <p className="font-medium text-green-600">Completed</p>
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-muted/50 rounded p-3">
            <p className="mb-1">🎉 Your reward has been added to your wallet!</p>
            <p>💰 Funds are now available for use in your account.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}