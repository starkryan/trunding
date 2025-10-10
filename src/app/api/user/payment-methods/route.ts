import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { z } from "zod"

// Validation schemas
const createBankAccountSchema = z.object({
  type: z.literal("BANK_ACCOUNT"),
  accountName: z.string().min(2, "Account name must be at least 2 characters"),
  accountNumber: z.string().min(8, "Account number must be at least 8 characters"),
  bankName: z.string().min(2, "Bank name must be at least 2 characters"),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format"),
  isDefault: z.boolean().optional(),
})

const createUpiSchema = z.object({
  type: z.literal("UPI"),
  upiId: z.string().regex(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/, "Invalid UPI ID format"),
  upiName: z.string().min(2, "UPI name must be at least 2 characters"),
  phoneNumber: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number format"),
  isDefault: z.boolean().optional(),
})

const createPaymentMethodSchema = z.discriminatedUnion("type", [
  createBankAccountSchema,
  createUpiSchema,
])

const updatePaymentMethodSchema = z.object({
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

// GET - Fetch user's payment methods
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

    // Get user's payment methods
    const paymentMethods = await prisma.withdrawalMethod.findMany({
      where: {
        userId: userId,
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        type: true,
        isDefault: true,
        isActive: true,
        accountName: true,
        accountNumber: true, // Include to create masked version
        bankName: true,
        ifscCode: true,
        upiId: true,
        upiName: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    // Mask account numbers for security
    const maskedPaymentMethods = paymentMethods.map(method => ({
      ...method,
      accountNumber: method.type === 'BANK_ACCOUNT' ? "****-****-****-1234" : undefined
    }))

    return NextResponse.json({
      success: true,
      paymentMethods: maskedPaymentMethods
    })
  } catch (error) {
    console.error("Payment methods fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create new payment method
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
    const validatedData = createPaymentMethodSchema.parse(body)

    // If setting as default, unset other default methods
    if (validatedData.isDefault) {
      await prisma.withdrawalMethod.updateMany({
        where: {
          userId: userId,
          type: validatedData.type,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      })
    }

    // Create the payment method
    const paymentMethod = await prisma.withdrawalMethod.create({
      data: {
        userId: userId,
        type: validatedData.type,
        isDefault: validatedData.isDefault || false,
        isActive: true,
        // Bank account details
        accountName: validatedData.type === 'BANK_ACCOUNT' ? validatedData.accountName : undefined,
        accountNumber: validatedData.type === 'BANK_ACCOUNT' ? validatedData.accountNumber : undefined,
        bankName: validatedData.type === 'BANK_ACCOUNT' ? validatedData.bankName : undefined,
        ifscCode: validatedData.type === 'BANK_ACCOUNT' ? validatedData.ifscCode : undefined,
        // UPI details
        upiId: validatedData.type === 'UPI' ? validatedData.upiId : undefined,
        upiName: validatedData.type === 'UPI' ? validatedData.upiName : undefined,
        phoneNumber: validatedData.type === 'UPI' ? validatedData.phoneNumber : undefined,
      },
      select: {
        id: true,
        type: true,
        isDefault: true,
        isActive: true,
        accountName: true,
        bankName: true,
        ifscCode: true,
        upiId: true,
        upiName: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true,
        // Don't return accountNumber for security
      }
    })

    return NextResponse.json({
      success: true,
      paymentMethod
    })
  } catch (error) {
    console.error("Payment method creation error:", error)

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
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}