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

  if (!session?.session?.userId) {
    return { error: "Authentication required", status: 401 }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.session.userId },
    select: { role: true }
  })

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return { error: "Admin access required", status: 403 }
  }

  return { adminId: session.session.userId }
}

const updateWithdrawalRequestSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED', 'FAILED']),
  adminNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
})

// GET - Fetch specific withdrawal request (admin)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authorization
    const authResult = await checkAdminAuth()
    if (authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    const { id } = await params

    // Get the specific withdrawal request with full details
    const withdrawalRequest = await prisma.withdrawalRequest.findUnique({
      where: { id: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          }
        },
        withdrawalMethod: {
          select: {
            id: true,
            type: true,
            accountName: true,
            accountNumber: true, // Admin can see full account number
            bankName: true,
            ifscCode: true,
            upiId: true,
            upiName: true,
            phoneNumber: true,
            isDefault: true,
            isActive: true,
            createdAt: true,
          }
        }
      }
    })

    if (!withdrawalRequest) {
      return NextResponse.json(
        { success: false, error: "Withdrawal request not found" },
        { status: 404 }
      )
    }

    // Get user's wallet information
    const userWallet = await prisma.wallet.findUnique({
      where: { userId: withdrawalRequest.userId },
      select: {
        id: true,
        balance: true,
        currency: true,
      }
    })

    // Get related transactions
    const relatedTransactions = await prisma.transaction.findMany({
      where: {
        userId: withdrawalRequest.userId,
        referenceId: withdrawalRequest.id,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      withdrawalRequest: {
        ...withdrawalRequest,
        userWallet,
        relatedTransactions
      }
    })
  } catch (error) {
    console.error("Admin withdrawal request fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT - Update withdrawal request (approve/reject)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authorization
    const authResult = await checkAdminAuth()
    if (authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    const adminId = authResult.adminId
    const { id } = await params
    const body = await request.json()

    // Validate request body
    const validatedData = updateWithdrawalRequestSchema.parse(body)

    // Check if withdrawal request exists
    const existingRequest = await prisma.withdrawalRequest.findUnique({
      where: { id: id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        },
        withdrawalMethod: true
      }
    })

    if (!existingRequest) {
      return NextResponse.json(
        { success: false, error: "Withdrawal request not found" },
        { status: 404 }
      )
    }

    // Prevent status changes from certain statuses
    if (existingRequest.status === 'COMPLETED' || existingRequest.status === 'FAILED') {
      return NextResponse.json(
        { success: false, error: "Cannot modify completed or failed withdrawal requests" },
        { status: 400 }
      )
    }

    // Use transaction to ensure atomic operation
    const result = await prisma.$transaction(async (tx) => {
      // Update withdrawal request
      const updatedRequest = await tx.withdrawalRequest.update({
        where: { id: id },
        data: {
          status: validatedData.status,
          adminNotes: validatedData.adminNotes,
          rejectionReason: validatedData.status === 'REJECTED' ? validatedData.rejectionReason : null,
          processedBy: adminId,
          processedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          withdrawalMethod: {
            select: {
              id: true,
              type: true,
              accountName: true,
              accountNumber: true,
              bankName: true,
              ifscCode: true,
              upiId: true,
              upiName: true,
              phoneNumber: true,
            }
          }
        }
      })

      // Get user's wallet
      const wallet = await tx.wallet.findUnique({
        where: { userId: existingRequest.userId }
      })

      if (!wallet) {
        throw new Error("User wallet not found")
      }

      // Handle different status changes
      if (validatedData.status === 'APPROVED') {
        // Update related transaction to completed
        await tx.transaction.updateMany({
          where: {
            userId: existingRequest.userId,
            referenceId: id,
            type: "WITHDRAWAL",
          },
          data: {
            status: "COMPLETED",
            description: `Withdrawal approved to ${existingRequest.withdrawalMethod.type === 'BANK_ACCOUNT' ? existingRequest.withdrawalMethod.bankName : 'UPI'}`,
          }
        })

        // Deduct from wallet balance
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: wallet.balance - existingRequest.amount
          }
        })

        // Create withdrawal completion transaction
        await tx.transaction.create({
          data: {
            userId: existingRequest.userId,
            walletId: wallet.id,
            amount: existingRequest.amount,
            currency: existingRequest.currency,
            type: "WITHDRAWAL",
            status: "COMPLETED",
            description: `Withdrawal processed to ${existingRequest.withdrawalMethod.type === 'BANK_ACCOUNT' ? existingRequest.withdrawalMethod.bankName : 'UPI'}`,
            referenceId: id,
            metadata: {
              withdrawalRequestId: id,
              withdrawalMethodType: existingRequest.withdrawalMethod.type,
              processedBy: adminId,
              processedAt: new Date().toISOString()
            }
          }
        })

      } else if (validatedData.status === 'REJECTED') {
        // Update related transaction to failed
        await tx.transaction.updateMany({
          where: {
            userId: existingRequest.userId,
            referenceId: id,
            type: "WITHDRAWAL",
          },
          data: {
            status: "FAILED",
            description: `Withdrawal rejected: ${validatedData.rejectionReason || 'Admin rejected'}`,
          }
        })

        // Return amount to wallet balance (if it was deducted)
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: wallet.balance + existingRequest.amount
          }
        })

        // Create rejection transaction
        await tx.transaction.create({
          data: {
            userId: existingRequest.userId,
            walletId: wallet.id,
            amount: existingRequest.amount,
            currency: existingRequest.currency,
            type: "REWARD", // Type as reward to add balance back
            status: "COMPLETED",
            description: `Withdrawal rejected - amount refunded: ${validatedData.rejectionReason || 'Admin rejected'}`,
            referenceId: id,
            metadata: {
              withdrawalRequestId: id,
              withdrawalMethodType: existingRequest.withdrawalMethod.type,
              processedBy: adminId,
              processedAt: new Date().toISOString(),
              isRefund: true
            }
          }
        })

      } else if (validatedData.status === 'PROCESSING') {
        // Update related transaction to processing
        await tx.transaction.updateMany({
          where: {
            userId: existingRequest.userId,
            referenceId: id,
            type: "WITHDRAWAL",
          },
          data: {
            status: "PROCESSING",
            description: `Withdrawal being processed to ${existingRequest.withdrawalMethod.type === 'BANK_ACCOUNT' ? existingRequest.withdrawalMethod.bankName : 'UPI'}`,
          }
        })
      }

      return updatedRequest
    })

    return NextResponse.json({
      success: true,
      withdrawalRequest: result
    })
  } catch (error) {
    console.error("Admin withdrawal request update error:", error)

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

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}