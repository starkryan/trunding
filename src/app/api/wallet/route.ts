import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated using modern Better Auth pattern
    const session = await auth.api.getSession({
      headers: await headers()
    })
    
    if (!session?.session?.userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const userId = session.session.userId

    // Get or create wallet for the user using upsert
    const wallet = await prisma.wallet.upsert({
      where: { userId: userId },
      update: {}, // No update needed if wallet exists
      create: {
        userId: userId,
        balance: 0,
        currency: "INR",
      },
      include: {
        _count: {
          select: {
            transaction: true
          }
        }
      }
    })

    // Get recent transactions for the user
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      select: {
        id: true,
        amount: true,
        currency: true,
        type: true,
        status: true,
        description: true,
        createdAt: true,
        metadata: true
      }
    })

    // Calculate total deposits and withdrawals
    const transactionStats = await prisma.transaction.groupBy({
      by: ['type'],
      where: {
        userId: userId,
        status: 'COMPLETED'
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    })

    // Calculate totals
    let totalDeposits = 0
    let totalWithdrawals = 0
    let depositCount = 0
    let withdrawalCount = 0

    transactionStats.forEach(stat => {
      if (stat.type === 'DEPOSIT' || stat.type === 'REWARD') {
        totalDeposits += stat._sum.amount || 0
        depositCount += stat._count.id
      } else if (stat.type === 'WITHDRAWAL') {
        totalWithdrawals += stat._sum.amount || 0
        withdrawalCount += stat._count.id
      }
    })

    return NextResponse.json({
      success: true,
      wallet: {
        id: wallet.id,
        balance: wallet.balance,
        currency: wallet.currency,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt,
      },
      stats: {
        totalTransactions: wallet._count.transaction,
        totalDeposits,
        totalWithdrawals,
        depositCount,
        withdrawalCount,
        netFlow: totalDeposits - totalWithdrawals,
        availableBalance: wallet.balance
      },
      recentTransactions: recentTransactions.map(tx => ({
        id: tx.id,
        amount: tx.amount,
        currency: tx.currency,
        type: tx.type,
        status: tx.status,
        description: tx.description,
        date: tx.createdAt,
        metadata: tx.metadata
      }))
    })
  } catch (error) {
    console.error("Wallet fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth.api.getSession({
      headers: await headers()
    })
    
    if (!session?.session?.userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const userId = session.session.userId
    const body = await request.json()
    const { action, amount } = body

    if (!action || typeof amount !== 'number') {
      return NextResponse.json(
        { success: false, error: "Invalid request parameters" },
        { status: 400 }
      )
    }

    // Only allow certain actions for security
    const allowedActions = ['add_balance', 'subtract_balance']
    if (!allowedActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action" },
        { status: 400 }
      )
    }

    // Use transaction to ensure atomic operation
    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId: userId }
      })

      if (!wallet) {
        throw new Error("Wallet not found")
      }

      let newBalance = wallet.balance
      
      if (action === 'add_balance') {
        newBalance += amount
      } else if (action === 'subtract_balance') {
        if (newBalance < amount) {
          throw new Error("Insufficient balance")
        }
        newBalance -= amount
      }

      // Update wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance }
      })

      // Create transaction record
      const transactionType = action === 'add_balance' ? 'DEPOSIT' : 'WITHDRAWAL'
      await tx.transaction.create({
        data: {
          userId: userId,
          walletId: wallet.id,
          amount: amount,
          currency: wallet.currency,
          type: transactionType,
          status: "COMPLETED",
          description: `Manual ${action.replace('_', ' ')}: ${amount} ${wallet.currency}`,
          metadata: {
            manualAction: true,
            action: action,
            previousBalance: wallet.balance,
            newBalance: newBalance
          }
        }
      })

      return updatedWallet
    })

    return NextResponse.json({
      success: true,
      wallet: {
        id: result.id,
        balance: result.balance,
        currency: result.currency,
        updatedAt: result.updatedAt
      }
    })
  } catch (error) {
    console.error("Wallet update error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    )
  }
}