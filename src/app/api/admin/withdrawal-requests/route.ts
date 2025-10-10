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
  status: z.enum(['APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
  adminNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
})

// GET - Fetch all withdrawal requests (admin)
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

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause
    const whereClause: any = {}
    if (status && status !== 'all') {
      whereClause.status = status
    }

    // Get withdrawal requests with user and payment method details
    const [withdrawalRequests, totalCount] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit,
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
              accountNumber: true, // Admin can see full account number
              bankName: true,
              ifscCode: true,
              upiId: true,
              upiName: true,
              phoneNumber: true,
            }
          }
        }
      }),
      prisma.withdrawalRequest.count({ where: whereClause })
    ])

    return NextResponse.json({
      success: true,
      withdrawalRequests,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error("Admin withdrawal requests fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create admin notes on withdrawal request (if needed)
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
    const { withdrawalRequestId, notes } = body

    if (!withdrawalRequestId || !notes) {
      return NextResponse.json(
        { success: false, error: "Withdrawal request ID and notes are required" },
        { status: 400 }
      )
    }

    // Update withdrawal request with admin notes
    const updatedRequest = await prisma.withdrawalRequest.update({
      where: { id: withdrawalRequestId },
      data: {
        adminNotes: notes,
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

    return NextResponse.json({
      success: true,
      withdrawalRequest: updatedRequest
    })
  } catch (error) {
    console.error("Admin notes creation error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}