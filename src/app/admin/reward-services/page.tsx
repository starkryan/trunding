"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Gift,
  Plus,
  Edit,
  Trash2,
  Calculator,
  Settings,
  TrendingUp,
    Copy,
  Eye,
  MoreHorizontal,
  IndianRupee,
  FunctionSquare,
  Percent,
  Target,
  CheckCircle,
  XCircle,
  Coins,
  BarChart3,
  AlertCircle,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

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

// Zod schema for form validation
const rewardServiceSchema = z.object({
  name: z.enum(["Bronze", "Silver", "Gold", "Platinum", "Diamond"]),
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters"),
  formula: z.string()
    .min(1, "Formula is required")
    .regex(/^[\d\s+\-*/().amount]+$/, "Formula can only contain numbers, operators, parentheses, and 'amount' variable")
    .refine((formula) => {
      try {
        // Test if formula is valid and contains 'amount'
        const testFormula = formula.replace(/amount/g, "1000");
        eval(testFormula);
        return formula.includes('amount');
      } catch {
        return false;
      }
    }, "Formula must be valid and contain 'amount' variable"),
  formulaDisplay: z.string()
    .min(1, "Display formula is required")
    .max(100, "Display formula must be less than 100 characters"),
  exampleAmount: z.number()
    .min(1, "Example amount must be at least 1")
    .max(100000, "Example amount must be less than 100,000"),
  isActive: z.boolean(),
});

type RewardServiceFormData = z.infer<typeof rewardServiceSchema>;

export default function RewardServicesPage() {
  const [services, setServices] = useState<RewardService[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<RewardService | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize form with react-hook-form and Zod validation
  const form = useForm<RewardServiceFormData>({
    resolver: zodResolver(rewardServiceSchema),
    defaultValues: {
      name: "Bronze",
      description: "",
      formula: "(amount * 0.03) + 6",
      formulaDisplay: "(Amount × 3%) + 6",
      exampleAmount: 1000,
      isActive: true,
    },
  });

  // Predefined service tiers with their properties
  const serviceTiers = [
    {
      name: "Bronze",
      exampleAmount: 300,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200"
    },
    {
      name: "Silver",
      exampleAmount: 1000,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200"
    },
    {
      name: "Gold",
      exampleAmount: 5000,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200"
    },
    {
      name: "Platinum",
      exampleAmount: 10000,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200"
    },
    {
      name: "Diamond",
      exampleAmount: 25000,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    }
  ];

  
  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await fetch('/api/admin/reward-services');
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

  const handleCreateService = async (data: RewardServiceFormData) => {
    try {
      setFormError(null);
      const response = await fetch('/api/admin/reward-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        await loadServices();
        form.reset();
        setIsCreateDialogOpen(false);
      } else {
        const error = await response.json();
        setFormError(error.error || 'Failed to create service');
      }
    } catch (error) {
      console.error('Failed to create service:', error);
      setFormError('Network error occurred');
    }
  };

  const handleUpdateService = async (data: RewardServiceFormData) => {
    if (!editingService) return;

    try {
      setFormError(null);
      const response = await fetch(`/api/admin/reward-services/${editingService.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        await loadServices();
        setEditingService(null);
        setIsCreateDialogOpen(false);
      } else {
        const error = await response.json();
        setFormError(error.error || 'Failed to update service');
      }
    } catch (error) {
      console.error('Failed to update service:', error);
      setFormError('Network error occurred');
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/reward-services/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadServices();
      } else {
        const error = await response.json();
        console.error('Failed to delete service:', error);
      }
    } catch (error) {
      console.error('Failed to delete service:', error);
    }
  };

  const handleToggleService = async (id: string) => {
    const service = services.find(s => s.id === id);
    if (!service) return;

    try {
      const response = await fetch(`/api/admin/reward-services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !service.isActive })
      });

      if (response.ok) {
        await loadServices();
      } else {
        const error = await response.json();
        console.error('Failed to toggle service:', error);
      }
    } catch (error) {
      console.error('Failed to toggle service:', error);
    }
  };

  const startEdit = (service: RewardService) => {
    setEditingService(service);
    form.reset({
      name: service.name as "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond",
      description: service.description,
      formula: service.formula,
      formulaDisplay: service.formulaDisplay,
      exampleAmount: service.exampleAmount,
      isActive: service.isActive,
    });
    setIsCreateDialogOpen(true);
  };

  const testFormula = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const formData = form.getValues();
      calculateReward(formData.exampleAmount, formData.formula);
      setIsCalculating(false);
    }, 500);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Gift className="h-8 w-8 text-primary" />
            Reward Services
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Create and manage reward calculation services for your platform
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingService(null);
              form.reset({
                name: "Bronze",
                description: "",
                formula: "(amount * 0.03) + 6",
                formulaDisplay: "(Amount × 3%) + 6",
                exampleAmount: 1000,
                isActive: true,
              });
              setFormError(null);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Create Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingService ? "Edit Reward Service" : "Create Reward Service"}
              </DialogTitle>
              <DialogDescription>
                Configure a reward calculation service with custom formula or use predefined templates
              </DialogDescription>
            </DialogHeader>

            {/* Error Display */}
            {formError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Error</span>
                </div>
                <p className="text-sm text-destructive/90 mt-1">{formError}</p>
              </div>
            )}

            <Form {...form}>
              <form id="reward-service-form" onSubmit={form.handleSubmit(editingService ? handleUpdateService : handleCreateService)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Service Tier
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a service tier" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {serviceTiers.map((tier) => (
                              <SelectItem key={tier.name} value={tier.name}>
                                <div className="flex items-center gap-2">
                                  <Gift className={cn("h-4 w-4", tier.color)} />
                                  {tier.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="exampleAmount"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="flex items-center gap-2">
                          <IndianRupee className="h-4 w-4" />
                          Example Amount (₹)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1000"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe this reward service"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="formula"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="flex items-center gap-2">
                          <FunctionSquare className="h-4 w-4" />
                          Formula (use 'amount' variable)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="(amount * 0.03) + 6"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          Use valid JavaScript math expressions with 'amount' variable
                        </FormDescription>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="formulaDisplay"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="flex items-center gap-2">
                          <Percent className="h-4 w-4" />
                          Display Formula
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="(Amount × 3%) + 6"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0">
                      <div className="space-y-0.5">
                        <FormLabel className="flex items-center gap-2">
                          {field.value ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          Active Status
                        </FormLabel>
                        <FormDescription className="text-sm">
                          Enable or disable this service
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Formula Testing */}
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <FormLabel className="text-sm font-medium flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Test Formula
                    </FormLabel>
                    <Button type="button" size="sm" variant="outline" onClick={testFormula} disabled={isCalculating}>
                      {isCalculating ? (
                        <>
                          <Settings className="mr-2 h-4 w-4 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <Calculator className="mr-2 h-4 w-4" />
                          Test
                        </>
                      )}
                    </Button>
                  </div>
                  {form.watch("formula") && form.watch("exampleAmount") && (
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-3 w-3" />
                        Input: {formatCurrency(form.watch("exampleAmount"))}
                      </div>
                      <div className="flex items-center gap-2">
                        <FunctionSquare className="h-3 w-3" />
                        Formula: {form.watch("formulaDisplay")}
                      </div>
                      {isCalculating ? (
                        <div className="flex items-center gap-2">
                          <Settings className="h-3 w-3 animate-spin" />
                          Calculating...
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <Coins className="h-3 w-3 text-green-600" />
                            Reward: {formatCurrency(calculateReward(form.watch("exampleAmount"), form.watch("formula")).reward)}
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-3 w-3 text-blue-600" />
                            Quota: {formatCurrency(calculateReward(form.watch("exampleAmount"), form.watch("formula")).quota)}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </form>
            </Form>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                form="reward-service-form"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Settings className="mr-2 h-4 w-4 animate-spin" />
                    {editingService ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  editingService ? "Update Service" : "Create Service"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Services Grid */}
      <div className="space-y-4">
        {/* Active Services */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Active Services ({services.filter(s => s.isActive).length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.filter(s => s.isActive).map((service) => {
              const tier = serviceTiers.find(t => t.name === service.name);
              return (
                <Card key={service.id} className="transition-all hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <Gift className={cn("h-5 w-5",
                            service.name === "Bronze" ? "text-amber-600" :
                            service.name === "Silver" ? "text-gray-600" :
                            service.name === "Gold" ? "text-yellow-600" :
                            service.name === "Platinum" ? "text-purple-600" :
                            service.name === "Diamond" ? "text-blue-600" :
                            "text-primary"
                          )} />
                          <div>
                            <div className="font-semibold">{service.name}</div>
                            <Badge variant="outline" className={cn(
                              "text-xs mt-1",
                              service.name === "Bronze" ? "border-amber-200 text-amber-700" :
                              service.name === "Silver" ? "border-gray-200 text-gray-700" :
                              service.name === "Gold" ? "border-yellow-200 text-yellow-700" :
                              service.name === "Platinum" ? "border-purple-200 text-purple-700" :
                              service.name === "Diamond" ? "border-blue-200 text-blue-700" :
                              "border-primary/20 text-primary"
                            )}>
                              {tier?.exampleAmount ? `Min: ${formatCurrency(tier.exampleAmount)}` : "Custom"}
                            </Badge>
                          </div>
                        </CardTitle>
                        <CardDescription className="flex items-start gap-2">
                          <BarChart3 className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                          <span>{service.description}</span>
                        </CardDescription>
                      </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => startEdit(service)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleService(service.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        {service.isActive ? "Disable" : "Enable"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        navigator.clipboard.writeText(service.formula);
                      }}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Formula
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteService(service.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={service.isActive ? "default" : "secondary"} className="flex items-center gap-1">
                    {service.isActive ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    {service.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium flex items-center gap-2 mb-1">
                      <FunctionSquare className="h-4 w-4" />
                      Formula:
                    </span>
                    <div className="font-mono bg-muted px-2 py-1 rounded text-xs mt-1">
                      {service.formulaDisplay}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Example Calculation:
                  </div>
                  <div className="space-y-1 text-sm">
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
              </CardContent>
            </Card>
          );
        })}
        </div>
      </div>

        {/* Inactive Services */}
        {services.filter(s => !s.isActive).length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Inactive Services ({services.filter(s => !s.isActive).length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {services.filter(s => !s.isActive).map((service) => {
                const tier = serviceTiers.find(t => t.name === service.name);
                return (
                  <Card key={service.id} className="opacity-75">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="flex items-center gap-2">
                            <Gift className={cn("h-5 w-5",
                              service.name === "Bronze" ? "text-amber-600" :
                              service.name === "Silver" ? "text-gray-600" :
                              service.name === "Gold" ? "text-yellow-600" :
                              service.name === "Platinum" ? "text-purple-600" :
                              service.name === "Diamond" ? "text-blue-600" :
                              "text-primary"
                            )} />
                            <div>
                              <div className="font-semibold">{service.name}</div>
                              <Badge variant="outline" className={cn(
                                "text-xs mt-1",
                                service.name === "Bronze" ? "border-amber-200 text-amber-700" :
                                service.name === "Silver" ? "border-gray-200 text-gray-700" :
                                service.name === "Gold" ? "border-yellow-200 text-yellow-700" :
                                service.name === "Platinum" ? "border-purple-200 text-purple-700" :
                                service.name === "Diamond" ? "border-blue-200 text-blue-700" :
                                "border-primary/20 text-primary"
                              )}>
                                {tier?.exampleAmount ? `Min: ${formatCurrency(tier.exampleAmount)}` : "Custom"}
                              </Badge>
                            </div>
                          </CardTitle>
                          <CardDescription className="flex items-start gap-2">
                            <BarChart3 className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <span>{service.description}</span>
                          </CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => startEdit(service)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleService(service.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              {service.isActive ? "Disable" : "Enable"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              navigator.clipboard.writeText(service.formula);
                            }}>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Formula
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteService(service.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge variant={service.isActive ? "default" : "secondary"} className="flex items-center gap-1">
                          {service.isActive ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {service.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium flex items-center gap-2 mb-1">
                            <FunctionSquare className="h-4 w-4" />
                            Formula:
                          </span>
                          <div className="font-mono bg-muted px-2 py-1 rounded text-xs mt-1">
                            {service.formulaDisplay}
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-3">
                        <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                          <Calculator className="h-4 w-4" />
                          Example Calculation:
                        </div>
                        <div className="space-y-1 text-sm">
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
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {services.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Gift className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-orange-500" />
              No Reward Services
            </h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Create your first reward service to start offering rewards to your users
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <Target className="h-4 w-4" />
              Create Service
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}