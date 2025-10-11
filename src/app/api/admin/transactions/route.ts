import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { z } from "zod"

// Admin authorization middleware
async function checkAdminAuth() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.session?.userId || !session.user || !session.user.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return { error: "Unauthorized", status: 401 }
  }

  return { adminId: session.session.userId }
}

const transactionFiltersSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['ALL', 'PENDING', 'COMPLETED', 'FAILED', 'PROCESSING']).optional(),
  type: z.enum(['ALL', 'DEPOSIT', 'WITHDRAWAL', 'ADMIN_ADJUSTMENT_ADD', 'ADMIN_ADJUSTMENT_SUBTRACT', 'REWARD', 'TRADE_BUY', 'TRADE_SELL']).optional(),
  method: z.string().optional(),
  userId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  sortBy: z.enum(['createdAt', 'amount', 'status', 'type']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// GET - Fetch all transactions with advanced filtering
export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const authResult = await checkAdminAuth()
    if (authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    const { searchParams } = new URL(request.url)

    // Parse and validate query parameters
    const filters = transactionFiltersSchema.parse({
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined,
      method: searchParams.get('method') || undefined,
      userId: searchParams.get('userId') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      minAmount: searchParams.get('minAmount') ? parseFloat(searchParams.get('minAmount')) : undefined,
      maxAmount: searchParams.get('maxAmount') ? parseFloat(searchParams.get('maxAmount')) : undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc'
    })

    const skip = (filters.page - 1) * filters.limit

    // Build where clause
    const where: any = {}

    // Search filter
    if (filters.search) {
      where.OR = [
        { user: { name: { contains: filters.search, mode: 'insensitive' } } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
        { referenceId: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ]
    }

    // Status filter
    if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status
    }

    // Type filter
    if (filters.type && filters.type !== 'ALL') {
      where.type = filters.type
    }

    // User filter
    if (filters.userId) {
      where.userId = filters.userId
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom)
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo)
      }
    }

    // Amount range filter
    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      where.amount = {}
      if (filters.minAmount !== undefined) {
        where.amount.gte = filters.minAmount
      }
      if (filters.maxAmount !== undefined) {
        where.amount.lte = filters.maxAmount
      }
    }

    // Execute queries in parallel
    const [transactions, totalCount, stats] = await Promise.all([
      // Fetch transactions with filtering
      prisma.transaction.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          wallet: {
            select: {
              id: true,
              currency: true
            }
          }
        },
        orderBy: {
          [filters.sortBy]: filters.sortOrder
        },
        skip,
        take: filters.limit
      }),

      // Get total count for pagination
      prisma.transaction.count({ where }),

      // Get comprehensive statistics
      prisma.transaction.groupBy({
        by: ['status', 'type'],
        where: filters.dateFrom || filters.dateTo ? {
          createdAt: {
            ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
            ...(filters.dateTo && { lte: new Date(filters.dateTo) })
          }
        } : {},
        _sum: {
          amount: true
        },
        _count: {
          id: true
        }
      })
    ])

    // Process statistics
    const processedStats = {
      totalTransactions: totalCount,
      totalVolume: transactions.reduce((sum, t) => sum + t.amount, 0),
      byStatus: {
        PENDING: 0,
        COMPLETED: 0,
        FAILED: 0,
        PROCESSING: 0
      },
      byType: {},
      paymentMethods: {} as Record<string, { count: number; volume: number }>,
      dailyVolume: [] as Array<{ date: string; volume: number; count: number }>,
      monthlyTrends: [] as Array<{ month: string; deposits: number; withdrawals: number; net: number }>
    }

    // Process status stats
    stats.forEach(stat => {
      if (stat._sum.amount !== null) {
        if (stat.status in processedStats.byStatus) {
          processedStats.byStatus[stat.status as keyof typeof processedStats.byStatus] += stat._count.id
        }

        if (!processedStats.byType[stat.type]) {
          processedStats.byType[stat.type] = { count: 0, volume: 0 }
        }
        processedStats.byType[stat.type].count += stat._count.id
        processedStats.byType[stat.type].volume += stat._sum.amount
      }
    })

    // Get daily volume for last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const dailyVolume = await prisma.transaction.groupBy({
      by: {
        date: {
          date: 'createdAt'
        }
      },
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        },
        status: 'COMPLETED'
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      },
      orderBy: {
        date: 'desc'
      }
    })

    processedStats.dailyVolume = dailyVolume.map(d => ({
      date: d.date,
      volume: d._sum.amount || 0,
      count: d._count.id
    }))

    // Get monthly trends
    const monthlyTrends = await prisma.$queryRaw`
      SELECT
        DATE_TRUNC('month', "createdAt") as month,
        SUM(CASE WHEN "type" IN ('DEPOSIT', 'REWARD', 'ADMIN_ADJUSTMENT_ADD') THEN "amount" ELSE 0 END) as deposits,
        SUM(CASE WHEN "type" IN ('WITHDRAWAL', 'ADMIN_ADJUSTMENT_SUBTRACT') THEN "amount" ELSE 0 END) as withdrawals,
        COUNT(*) as count
      FROM "Transaction"
      WHERE "status" = 'COMPLETED'
      AND "createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month DESC
    ` as Array<{
      month: string
      deposits: string
      withdrawals: string
      count: string
    }>

    processedStats.monthlyTrends = monthlyTrends.map(trend => ({
      month: trend.month,
      deposits: parseFloat(trend.deposits),
      withdrawals: parseFloat(trend.withdrawals),
      net: parseFloat(trend.deposits) - parseFloat(trend.withdrawals),
      count: parseInt(trend.count)
    }))

    // Process transactions for response
    const processedTransactions = transactions.map(transaction => {
      // Extract method from metadata or reference
      let method = 'Unknown'
      if (transaction.metadata) {
        const metadata = transaction.metadata as any
        method = metadata.method || metadata.source || 'System'
      }
      if (transaction.referenceId) {
        method = transaction.referenceId.includes('KUKU') ? 'KukuPay' :
                transaction.referenceId.includes('UPI') ? 'UPI' :
                transaction.referenceId.includes('BANK') ? 'Bank Transfer' :
                transaction.referenceId.includes('CARD') ? 'Card' : 'System'
      }

      return {
        ...transaction,
        method,
        userBalance: transaction.wallet ? transaction.amount : 0 // Placeholder
      }
    })

    return NextResponse.json({
      success: true,
      transactions: processedTransactions,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: totalCount,
        pages: Math.ceil(totalCount / filters.limit)
      },
      statistics: processedStats,
      filters: {
        applied: {
          search: filters.search,
          status: filters.status,
          type: filters.type,
          method: filters.method,
          userId: filters.userId,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          minAmount: filters.minAmount,
          maxAmount: filters.maxAmount
        }
      }
    })
  } catch (error) {
    console.error("Admin transactions fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Export transactions to CSV
export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const authResult = await checkAdminAuth()
    if (authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await request.json()
    const { format = 'csv', filters = {} } = body

    if (format !== 'csv') {
      return NextResponse.json(
        { success: false, error: "Only CSV format is supported" },
        { status: 400 }
      )
    }

    // Get all transactions with same filtering logic
    const transactionFilters = transactionFiltersSchema.parse({
      page: 1,
      limit: 10000, // Large limit for export
      ...filters
    })

    const where: any = {}

    if (transactionFilters.search) {
      where.OR = [
        { user: { name: { contains: transactionFilters.search, mode: 'insensitive' } } },
        { user: { email: { contains: transactionFilters.search, mode: 'insensitive' } } },
        { referenceId: { contains: transactionFilters.search, mode: 'insensitive' } },
        { description: { contains: transactionFilters.search, mode: 'insensitive' } }
      ]
    }

    if (transactionFilters.status && transactionFilters.status !== 'ALL') {
      where.status = transactionFilters.status
    }

    if (transactionFilters.type && transactionFilters.type !== 'ALL') {
      where.type = transactionFilters.type
    }

    if (transactionFilters.userId) {
      where.userId = transactionFilters.userId
    }

    if (transactionFilters.dateFrom || transactionFilters.dateTo) {
      where.createdAt = {}
      if (transactionFilters.dateFrom) {
        where.createdAt.gte = new Date(transactionFilters.dateFrom)
      }
      if (transactionFilters.dateTo) {
        where.createdAt.lte = new Date(transactionFilters.dateTo)
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        wallet: {
          select: {
            currency: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Generate CSV content
    const headers = [
      'Transaction ID',
      'User Name',
      'User Email',
      'Type',
      'Status',
      'Amount',
      'Currency',
      'Method',
      'Description',
      'Reference ID',
      'Created At',
      'Updated At'
    ]

    const csvRows = transactions.map(transaction => {
      // Extract method
      let method = 'Unknown'
      if (transaction.metadata) {
        const metadata = transaction.metadata as any
        method = metadata.method || metadata.source || 'System'
      }
      if (transaction.referenceId) {
        method = transaction.referenceId.includes('KUKU') ? 'KukuPay' :
                transaction.referenceId.includes('UPI') ? 'UPI' :
                transaction.referenceId.includes('BANK') ? 'Bank Transfer' :
                transaction.referenceId.includes('CARD') ? 'Card' : 'System'
      }

      return [
        transaction.id,
        `"${transaction.user.name}"`,
        `"${transaction.user.email}"`,
        transaction.type,
        transaction.status,
        transaction.amount,
        transaction.wallet?.currency || 'INR',
        method,
        `"${transaction.description}"`,
        transaction.referenceId || '',
        transaction.createdAt.toISOString(),
        transaction.updatedAt.toISOString()
      ].join(',')
    })

    const csvContent = [headers.join(','), ...csvRows].join('\n')

    // Return CSV content
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="transactions_${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error("Admin transactions export error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}