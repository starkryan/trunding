import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { WebhookDeliveryTracker } from "@/lib/webhook-utils"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.session?.userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.session.userId },
      select: { role: true }
    })

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      )
    }

    // Get webhook statistics
    const stats = await WebhookDeliveryTracker.getWebhookStats()

    // Get recent webhook activity
    const recentWebhooks = await prisma.payment.findMany({
      where: {
        webhookReceived: true,
      },
      select: {
        id: true,
        providerOrderId: true,
        provider: true,
        status: true,
        amount: true,
        createdAt: true,
        completedAt: true,
        metadata: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // Get provider-specific stats
    const providerStats = await prisma.payment.groupBy({
      by: ['provider'],
      where: {
        webhookReceived: true,
      },
      _count: {
        id: true,
      },
      _sum: {
        amount: true,
      },
    })

    // Get daily webhook trends (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const dailyTrends = await prisma.payment.findMany({
      where: {
        webhookReceived: true,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        createdAt: true,
        status: true,
        amount: true,
        provider: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    // Process daily trends
    const trendsByDay = dailyTrends.reduce((acc, webhook) => {
      const day = webhook.createdAt.toISOString().split('T')[0]
      if (!acc[day]) {
        acc[day] = {
          date: day,
          total: 0,
          successful: 0,
          failed: 0,
          revenue: 0,
          byProvider: {} as Record<string, { count: number; revenue: number }>
        }
      }

      acc[day].total++
      acc[day].revenue += webhook.amount

      if (webhook.status === 'COMPLETED') {
        acc[day].successful++
      } else if (webhook.status === 'FAILED' || webhook.status === 'CANCELLED') {
        acc[day].failed++
      }

      if (!acc[day].byProvider[webhook.provider]) {
        acc[day].byProvider[webhook.provider] = { count: 0, revenue: 0 }
      }
      acc[day].byProvider[webhook.provider].count++
      acc[day].byProvider[webhook.provider].revenue += webhook.amount

      return acc
    }, {} as Record<string, any>)

    // Get error analysis
    const recentErrors = await prisma.payment.findMany({
      where: {
        webhookReceived: true,
        status: { in: ['FAILED', 'CANCELLED'] },
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        id: true,
        providerOrderId: true,
        provider: true,
        status: true,
        amount: true,
        createdAt: true,
        metadata: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          ...stats,
          successRate: stats.totalWebhooks > 0 ? (stats.successfulWebhooks / stats.totalWebhooks * 100).toFixed(2) : 0,
        },
        recentWebhooks: recentWebhooks.map(webhook => ({
          id: webhook.id,
          providerOrderId: webhook.providerOrderId,
          provider: webhook.provider,
          status: webhook.status,
          amount: webhook.amount,
          createdAt: webhook.createdAt,
          completedAt: webhook.completedAt,
          user: webhook.user,
          processingTime: webhook.completedAt
            ? webhook.completedAt.getTime() - webhook.createdAt.getTime()
            : null,
        })),
        providerStats: providerStats.map(stat => ({
          provider: stat.provider,
          count: stat._count.id,
          totalRevenue: stat._sum.amount || 0,
        })),
        dailyTrends: Object.values(trendsByDay),
        errorAnalysis: {
          recentErrors: recentErrors.map(error => ({
            id: error.id,
            providerOrderId: error.providerOrderId,
            provider: error.provider,
            status: error.status,
            amount: error.amount,
            createdAt: error.createdAt,
            errorMessage: (error.metadata as any)?.webhookData?.error || 'Unknown error',
          })),
          errorRate: stats.totalWebhooks > 0 ? (stats.failedWebhooks / stats.totalWebhooks * 100).toFixed(2) : 0,
        },
      }
    })

  } catch (error) {
    console.error("Webhook stats error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}