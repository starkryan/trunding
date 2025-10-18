import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { headers } from "next/headers"

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

// Validation schema for verification action
const verificationActionSchema = z.object({
  transactionId: z.string().min(1, "Transaction ID is required"),
  action: z.enum(['approve', 'reject']),
  adminNotes: z.string().optional(),
  rejectionReason: z.string().optional()
})

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

    // Validate input
    const validation = verificationActionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.error.issues.map(err => err.message)
        },
        { status: 400 }
      )
    }

    const { transactionId, action, adminNotes, rejectionReason } = validation.data

    // Find transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404 }
      )
    }

    // Check if transaction is in pending verification status
    if (transaction.verificationStatus !== 'PENDING_VERIFICATION') {
      return NextResponse.json(
        { success: false, error: "Transaction is not pending verification" },
        { status: 400 }
      )
    }

    // Check if verification is expired
    if (transaction.verificationExpiresAt && new Date() > transaction.verificationExpiresAt) {
      return NextResponse.json(
        { success: false, error: "Verification has expired. User must resubmit verification." },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {
      verificationProcessedAt: new Date(),
      verificationProcessedBy: authResult.adminId,
      adminNotes: adminNotes || null
    }

    if (action === 'approve') {
      updateData.verificationStatus = 'VERIFIED'
      updateData.status = 'COMPLETED' // Ensure transaction is marked as completed

      // For approved deposits, update wallet balance in a transaction
      if (transaction.type === 'DEPOSIT') {
        console.log("💰 [ADMIN VERIFY] Approving deposit, updating wallet balance...", {
          transactionId,
          amount: transaction.amount,
          userId: transaction.userId
        })

        // Use Prisma transaction for atomicity
        const result = await prisma.$transaction(async (tx) => {
          // Update transaction
          const updatedTx = await tx.transaction.update({
            where: { id: transactionId },
            data: updateData
          })

          // Update wallet balance
          const updatedWallet = await tx.wallet.update({
            where: { userId: transaction.userId },
            data: {
              balance: {
                increment: transaction.amount
              }
            }
          })

          console.log("💰 [ADMIN VERIFY] Wallet balance updated:", {
            oldBalance: updatedWallet.balance - transaction.amount,
            newBalance: updatedWallet.balance,
            increment: transaction.amount
          })

          return { updatedTx, updatedWallet }
        })

        return NextResponse.json({
          success: true,
          message: `Transaction verification approved successfully. Wallet balance credited with ₹${transaction.amount}`,
          transaction: {
            id: result.updatedTx.id,
            verificationStatus: result.updatedTx.verificationStatus,
            verificationProcessedAt: result.updatedTx.verificationProcessedAt,
            adminNotes: result.updatedTx.adminNotes,
            verificationRejectedReason: result.updatedTx.verificationRejectedReason,
            amount: transaction.amount,
            newWalletBalance: result.updatedWallet.balance,
            user: transaction.user
          }
        })
      }
    } else {
      updateData.verificationStatus = 'REJECTED'
      updateData.verificationRejectedReason = rejectionReason || 'No reason provided'
    }

    // Update transaction (for non-deposit approvals or rejections)
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      message: `Transaction verification ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      transaction: {
        id: updatedTransaction.id,
        verificationStatus: updatedTransaction.verificationStatus,
        verificationProcessedAt: updatedTransaction.verificationProcessedAt,
        adminNotes: updatedTransaction.adminNotes,
        verificationRejectedReason: updatedTransaction.verificationRejectedReason,
        user: transaction.user
      }
    })

  } catch (error) {
    console.error("Transaction verification action error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

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
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build where clause - exclude expired verifications
    const where: any = {
      verificationStatus: 'PENDING_VERIFICATION',
      OR: [
        { verificationExpiresAt: null },
        { verificationExpiresAt: { gt: new Date() } }
      ]
    }

    if (status && status !== 'ALL') {
      where.verificationStatus = status.toUpperCase()
    }

    const skip = (page - 1) * limit

    // Get pending verifications
    const [transactions, totalCount] = await Promise.all([
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
              currency: true,
              balance: true
            }
          }
        },
        orderBy: {
          verificationSubmittedAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.transaction.count({ where })
    ])

    return NextResponse.json({
      success: true,
      transactions: transactions.map(t => ({
        ...t,
        amount: typeof t.amount === 'bigint' ? Number(t.amount) : t.amount,
        walletBalance: t.wallet ? (typeof t.wallet.balance === 'bigint' ? Number(t.wallet.balance) : t.wallet.balance) : 0
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error("Get pending verifications error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}