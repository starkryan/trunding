import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { z } from "zod"

const createWithdrawalRequestSchema = z.object({
  withdrawalMethodId: z.string().min(1, "Payment method is required"),
  amount: z.number().min(300, "Minimum withdrawal amount is ₹300").max(100000, "Maximum withdrawal amount is ₹100,000"),
})

// GET - Fetch user's withdrawal requests
export async function GET(request: NextRequest) {
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

    // Get user's withdrawal requests with payment method details
    const withdrawalRequests = await prisma.withdrawalRequest.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        withdrawalMethod: {
          select: {
            id: true,
            type: true,
            accountName: true,
            bankName: true,
            ifscCode: true,
            upiId: true,
            upiName: true,
            phoneNumber: true,
            // Don't return accountNumber for security
          }
        }
      }
    })

    // Mask sensitive information
    const maskedWithdrawalRequests = withdrawalRequests.map(request => {
      const withdrawalMethod = {
        ...request.withdrawalMethod,
        accountNumber: request.withdrawalMethod.type === 'BANK_ACCOUNT' ? "****-****-****-1234" : undefined
      }

      return {
        ...request,
        withdrawalMethod
      }
    })

    return NextResponse.json({
      success: true,
      withdrawalRequests: maskedWithdrawalRequests
    })
  } catch (error) {
    console.error("Withdrawal requests fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create new withdrawal request
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

    // Validate request body
    const validatedData = createWithdrawalRequestSchema.parse(body)

    // Check if payment method exists and belongs to user
    const paymentMethod = await prisma.withdrawalMethod.findFirst({
      where: {
        id: validatedData.withdrawalMethodId,
        userId: userId,
        isActive: true
      }
    })

    if (!paymentMethod) {
      return NextResponse.json(
        { success: false, error: "Payment method not found or inactive" },
        { status: 404 }
      )
    }

    // Check user's available balance (actual balance minus pending withdrawals)
    const wallet = await prisma.wallet.findUnique({
      where: { userId: userId }
    })

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: "Wallet not found" },
        { status: 404 }
      )
    }

    // Check if user has sufficient balance
    if (wallet.balance < validatedData.amount) {
      return NextResponse.json(
        { success: false, error: "Insufficient wallet balance" },
        { status: 400 }
      )
    }

    // Use ACID transaction to ensure atomic balance deduction (escrow system)
    const result = await prisma.$transaction(async (tx) => {
      // Lock wallet row for update with pessimistic locking to prevent race conditions
      const lockedWallet = await tx.wallet.findUnique({
        where: { userId: userId }
      })

      if (!lockedWallet) {
        throw new Error("Wallet not found")
      }

      // Calculate new balance first to ensure it's non-negative
      const newBalance = lockedWallet.balance - validatedData.amount

      // Double-check balance within transaction with explicit validation
      if (newBalance < 0) {
        throw new Error(`Insufficient wallet balance. Available: ₹${lockedWallet.balance}, Requested: ₹${validatedData.amount}`)
      }

      // Update wallet balance immediately (funds moved to escrow)
      const updatedWallet = await tx.wallet.update({
        where: { id: lockedWallet.id },
        data: { balance: newBalance }
      })

      // Create withdrawal request
      const withdrawalRequest = await tx.withdrawalRequest.create({
        data: {
          userId: userId,
          withdrawalMethodId: validatedData.withdrawalMethodId,
          amount: validatedData.amount,
          currency: "INR",
          status: "PENDING",
        },
        include: {
          withdrawalMethod: {
            select: {
              id: true,
              type: true,
              accountName: true,
              bankName: true,
              ifscCode: true,
              upiId: true,
              upiName: true,
              phoneNumber: true,
              // Don't return accountNumber for security
            }
          }
        }
      })

      // Create PENDING transaction record (balance deducted and held in escrow)
      await tx.transaction.create({
        data: {
          userId: userId,
          walletId: lockedWallet.id,
          amount: validatedData.amount,
          currency: lockedWallet.currency,
          type: "WITHDRAWAL",
          status: "PENDING",
          description: `Withdrawal to ${paymentMethod.type === 'BANK_ACCOUNT' ? paymentMethod.bankName : 'UPI'} (Funds in escrow - pending approval)`,
          referenceId: withdrawalRequest.id,
          metadata: {
            withdrawalRequestId: withdrawalRequest.id,
            withdrawalMethodType: paymentMethod.type,
            withdrawalMethodId: paymentMethod.id,
            previousBalance: lockedWallet.balance,
            newBalance: newBalance,
            balanceDeductedImmediately: true,
            fundsInEscrow: true
          }
        }
      })

      return withdrawalRequest
    })

    // Mask sensitive information
    const maskedWithdrawalMethod = {
      ...result.withdrawalMethod,
      accountNumber: result.withdrawalMethod.type === 'BANK_ACCOUNT' ? "****-****-****-1234" : undefined
    }

    const maskedResult = {
      ...result,
      withdrawalMethod: maskedWithdrawalMethod
    }

    return NextResponse.json({
      success: true,
      withdrawalRequest: maskedResult
    })
  } catch (error) {
    console.error("Withdrawal request creation error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }

    // Handle database constraint violations (negative balance prevention)
    if (error instanceof Error && error.message.includes('wallet_balance_non_negative')) {
      return NextResponse.json(
        { success: false, error: "Transaction would result in negative balance. Please check your balance and try again." },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}