'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Loader2, CreditCard, Settings, CheckCircle, XCircle } from 'lucide-react'

interface PaymentProvider {
  name: string
  enabled: boolean
  description: string
  apiKey?: boolean
}

interface PaymentProvidersResponse {
  success: boolean
  providers: Record<string, PaymentProvider>
}

export default function PaymentProviderManager() {
  const [providers, setProviders] = useState<Record<string, PaymentProvider>>({})
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchPaymentProviders()
  }, [])

  const fetchPaymentProviders = async () => {
    try {
      const response = await fetch('/api/admin/payment-providers')
      const data: PaymentProvidersResponse = await response.json()

      if (data.success) {
        setProviders(data.providers)
      } else {
        toast.error('Failed to fetch payment providers')
      }
    } catch (error) {
      console.error('Error fetching payment providers:', error)
      toast.error('Error fetching payment providers')
    } finally {
      setLoading(false)
    }
  }

  const updateProviderStatus = async (providerKey: string, enabled: boolean) => {
    setUpdating(providerKey)
    try {
      const response = await fetch('/api/admin/payment-providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: providerKey,
          enabled,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setProviders(prev => ({
          ...prev,
          [providerKey]: {
            ...prev[providerKey],
            enabled,
          },
        }))
        toast.success(`${data.provider.toUpperCase()} ${enabled ? 'enabled' : 'disabled'} successfully`)
      } else {
        toast.error(data.error || 'Failed to update provider status')
      }
    } catch (error) {
      console.error('Error updating provider status:', error)
      toast.error('Error updating provider status')
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading payment providers...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payment Providers</h2>
          <p className="text-muted-foreground">
            Manage and configure payment gateway providers
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchPaymentProviders}
          disabled={loading}
        >
          <Settings className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {Object.entries(providers).map(([key, provider]) => (
          <Card key={key} className="relative">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {provider.name}
                </CardTitle>
                <CardDescription>{provider.description}</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Badge
                  variant={provider.enabled ? 'default' : 'secondary'}
                  className={
                    provider.enabled
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }
                >
                  {provider.enabled ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <XCircle className="h-3 w-3 mr-1" />
                  )}
                  {provider.enabled ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label
                      htmlFor={`${key}-toggle`}
                      className="text-sm font-medium"
                    >
                      Enable Provider
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Allow users to make payments through {provider.name}
                    </p>
                  </div>
                  <Switch
                    id={`${key}-toggle`}
                    checked={provider.enabled}
                    onCheckedChange={(checked) =>
                      updateProviderStatus(key, checked)
                    }
                    disabled={updating === key}
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">API Status:</span>
                  <Badge
                    variant={provider.apiKey ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {provider.apiKey ? 'Configured' : 'Missing API Key'}
                  </Badge>
                </div>

                {updating === key && (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2 text-sm">Updating...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuration Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Payment providers require valid API keys configured in environment variables.</p>
          <p>• Only enabled providers will be available to users for making payments.</p>
          <p>• KUKUPAY and PAY0 support different payment methods and regions.</p>
          <p>• Webhook URLs are automatically configured for each provider.</p>
        </CardContent>
      </Card>
    </div>
  )
}