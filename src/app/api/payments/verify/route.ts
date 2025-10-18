import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { uploadTransactionScreenshot } from "@/lib/bunny-cdn"
import { headers } from "next/headers"

// Validation schema
const verificationSchema = z.object({
  transactionId: z.string().min(1, "Transaction ID is required"),
  utrNumber: z.string()
    .regex(/^\d{12}$/, "UTR number must be exactly 12 digits")
    .min(12, "UTR number must be exactly 12 digits")
    .max(12, "UTR number must be exactly 12 digits"),
})

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 [UTR VERIFY] Starting verification process")

    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers()
    })

    console.log("🔍 [UTR VERIFY] Session:", {
      hasSession: !!session,
      hasUserId: !!session?.session?.userId,
      hasUser: !!session?.user
    })

    if (!session?.session?.userId || !session.user) {
      console.log("❌ [UTR VERIFY] Unauthorized - no session or user")
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Parse form data (multipart for file upload)
    const formData = await request.formData()

    // Extract fields
    const transactionId = formData.get('transactionId') as string
    const utrNumber = formData.get('utrNumber') as string
    const screenshot = formData.get('screenshot') as File

    console.log("🔍 [UTR VERIFY] Form data extracted:", {
      transactionId,
      utrNumber,
      hasScreenshot: !!screenshot,
      screenshotName: screenshot?.name,
      screenshotSize: screenshot?.size
    })

    // Validate required fields
    if (!transactionId || !utrNumber || !screenshot) {
      return NextResponse.json(
        { success: false, error: "Transaction ID, UTR number, and screenshot are required" },
        { status: 400 }
      )
    }

    // Validate input data
    const validation = verificationSchema.safeParse({
      transactionId,
      utrNumber
    })

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

    // First check if this is a real transaction
    console.log("🔍 [UTR VERIFY] Searching for transaction with criteria:", {
      id: transactionId,
      userId: session.session.userId,
      type: 'DEPOSIT',
      status: 'PENDING'
    })

    let transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: session.session.userId,
        type: 'DEPOSIT',
        status: 'PENDING'
      }
    })

    // If not found in transactions, check if it's a payment that needs verification
    if (!transaction) {
      console.log("🔍 [UTR VERIFY] Not found in transactions, checking payments table...")

      const payment = await prisma.payment.findFirst({
        where: {
          id: transactionId,
          userId: session.session.userId,
          status: 'PENDING'
        }
      })

      if (payment) {
        console.log("🔍 [UTR VERIFY] Found pending payment, creating transaction for verification...")

        // Create a transaction for this payment so it can be verified
        transaction = await prisma.transaction.create({
          data: {
            id: payment.id, // Use payment ID as transaction ID
            userId: payment.userId,
            walletId: (await prisma.wallet.findFirst({ where: { userId: payment.userId } }))?.id || '',
            amount: payment.amount,
            currency: payment.currency,
            type: 'DEPOSIT',
            status: 'PENDING',
            verificationStatus: 'NONE',
            description: `Payment pending - Order: ${payment.providerOrderId}`,
            referenceId: payment.id,
            metadata: {
              ...(payment.metadata as Record<string, any> || {}),
              isPayment: true,
              providerOrderId: payment.providerOrderId
            }
          }
        })

        console.log("🔍 [UTR VERIFY] Created transaction for payment:", {
          transactionId: transaction.id,
          amount: transaction.amount,
          status: transaction.status
        })
      }
    }

    console.log("🔍 [UTR VERIFY] Final transaction result:", {
      found: !!transaction,
      transactionDetails: transaction ? {
        id: transaction.id,
        type: transaction.type,
        status: transaction.status,
        verificationStatus: transaction.verificationStatus,
        userId: transaction.userId
      } : null
    })

    if (!transaction) {
      console.log("❌ [UTR VERIFY] No transaction or payment found. Checking all user data...")

      // Debug: Show user's transactions and payments
      const [allUserTransactions, allUserPayments] = await Promise.all([
        prisma.transaction.findMany({
          where: { userId: session.session.userId },
          select: { id: true, type: true, status: true, amount: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 5
        }),
        prisma.payment.findMany({
          where: { userId: session.session.userId },
          select: { id: true, status: true, amount: true, providerOrderId: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 5
        })
      ])

      console.log("🔍 [UTR VERIFY] User's recent transactions:", allUserTransactions.map(t => ({
        id: t.id,
        type: t.type,
        status: t.status,
        amount: t.amount
      })))

      console.log("🔍 [UTR VERIFY] User's recent payments:", allUserPayments.map(p => ({
        id: p.id,
        status: p.status,
        amount: p.amount,
        orderId: p.providerOrderId
      })))

      return NextResponse.json(
        {
          success: false,
          error: "Transaction not found or not eligible for verification",
          debug: {
            transactionId,
            userId: session.session.userId,
            transactionCount: allUserTransactions.length,
            paymentCount: allUserPayments.length
          }
        },
        { status: 404 }
      )
    }

    // Check if verification already submitted
    if (transaction.verificationStatus !== 'NONE') {
      // Check if verification is expired and can be resubmitted
      if (
        transaction.verificationStatus === 'PENDING_VERIFICATION' &&
        transaction.verificationExpiresAt &&
        new Date() > transaction.verificationExpiresAt
      ) {
        // Reset expired verification to allow resubmission
        await prisma.transaction.update({
          where: { id: transactionId },
          data: {
            verificationStatus: 'NONE',
            verificationSubmittedAt: null,
            verificationExpiresAt: null,
            utrNumber: null,
            screenshotUrl: null,
            adminNotes: null,
            verificationRejectedReason: null,
            metadata: {
              ...(transaction.metadata as any || {}),
              verificationExpired: true,
              expiredAt: new Date().toISOString(),
              previousSubmission: {
                submittedAt: transaction.verificationSubmittedAt?.toISOString(),
                expiredAt: transaction.verificationExpiresAt?.toISOString()
              }
            }
          }
        })

        console.log("🔄 [UTR VERIFY] Reset expired verification, allowing resubmission")
      } else if (transaction.verificationStatus === 'REJECTED') {
        // Allow resubmission for rejected transactions
        await prisma.transaction.update({
          where: { id: transactionId },
          data: {
            verificationStatus: 'NONE',
            verificationSubmittedAt: null,
            verificationExpiresAt: null,
            utrNumber: null,
            screenshotUrl: null,
            adminNotes: null,
            verificationRejectedReason: null,
            metadata: {
              ...(transaction.metadata as any || {}),
              resubmissionAfterRejection: true,
              rejectedAt: new Date().toISOString(),
              previousRejection: {
                reason: transaction.verificationRejectedReason,
                rejectedAt: transaction.verificationProcessedAt?.toISOString()
              }
            }
          }
        })

        console.log("🔄 [UTR VERIFY] Reset rejected verification, allowing resubmission")
      } else {
        return NextResponse.json(
          {
            success: false,
            error: transaction.verificationStatus === 'PENDING_VERIFICATION'
              ? "Verification already submitted and is pending review"
              : "Verification already processed"
          },
          { status: 400 }
        )
      }
    }

    // Check if UTR number already exists
    const existingUtr = await prisma.transaction.findUnique({
      where: { utrNumber }
    })

    if (existingUtr) {
      return NextResponse.json(
        { success: false, error: "UTR number already exists" },
        { status: 400 }
      )
    }

    // Upload screenshot to Bunny CDN
    const uploadResult = await uploadTransactionScreenshot(screenshot)

    if (!uploadResult.success || !uploadResult.url) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to upload screenshot",
          details: uploadResult.error
        },
        { status: 500 }
      )
    }

    // Update transaction with verification details (7-day expiration)
    const submittedAt = new Date()
    const expiresAt = new Date(submittedAt.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days from now

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        utrNumber,
        screenshotUrl: uploadResult.url,
        verificationStatus: 'PENDING_VERIFICATION',
        verificationSubmittedAt: submittedAt,
        verificationExpiresAt: expiresAt,
        metadata: {
          ...(transaction.metadata as any || {}),
          verificationSubmitted: true,
          submittedAt: submittedAt.toISOString(),
          expiresAt: expiresAt.toISOString()
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: "Verification submitted successfully",
      transaction: {
        id: updatedTransaction.id,
        utrNumber: updatedTransaction.utrNumber,
        verificationStatus: updatedTransaction.verificationStatus,
        screenshotUrl: updatedTransaction.screenshotUrl,
        verificationSubmittedAt: updatedTransaction.verificationSubmittedAt
      }
    })

  } catch (error) {
    console.error("Payment verification error:", error)
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
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.session?.userId || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('transactionId')

    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: "Transaction ID is required" },
        { status: 400 }
      )
    }

    // Get transaction verification details
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: session.session.userId
      },
      select: {
        id: true,
        utrNumber: true,
        verificationStatus: true,
        screenshotUrl: true,
        verificationSubmittedAt: true,
        verificationProcessedAt: true,
        adminNotes: true,
        verificationRejectedReason: true
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      transaction
    })

  } catch (error) {
    console.error("Get verification details error:", error)
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