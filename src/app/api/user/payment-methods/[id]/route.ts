import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { z } from "zod"

const updatePaymentMethodSchema = z.object({
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

// GET - Fetch specific payment method
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params

    // Get the specific payment method
    const paymentMethod = await prisma.withdrawalMethod.findFirst({
      where: {
        id: id,
        userId: userId,
      },
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

    if (!paymentMethod) {
      return NextResponse.json(
        { success: false, error: "Payment method not found" },
        { status: 404 }
      )
    }

    // Mask account number if it's a bank account
    const maskedPaymentMethod = {
      ...paymentMethod,
      accountNumber: paymentMethod.type === 'BANK_ACCOUNT' ? "****-****-****-1234" : undefined
    }

    return NextResponse.json({
      success: true,
      paymentMethod: maskedPaymentMethod
    })
  } catch (error) {
    console.error("Payment method fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT - Update payment method
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params
    const body = await request.json()

    // Validate request body
    const validatedData = updatePaymentMethodSchema.parse(body)

    // Check if payment method exists and belongs to user
    const existingPaymentMethod = await prisma.withdrawalMethod.findFirst({
      where: {
        id: id,
        userId: userId,
      }
    })

    if (!existingPaymentMethod) {
      return NextResponse.json(
        { success: false, error: "Payment method not found" },
        { status: 404 }
      )
    }

    // If setting as default, unset other default methods of same type
    if (validatedData.isDefault) {
      await prisma.withdrawalMethod.updateMany({
        where: {
          userId: userId,
          type: existingPaymentMethod.type,
          id: { not: id },
          isDefault: true
        },
        data: {
          isDefault: false
        }
      })
    }

    // Update the payment method
    const updatedPaymentMethod = await prisma.withdrawalMethod.update({
      where: {
        id: id,
      },
      data: validatedData,
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
      paymentMethod: updatedPaymentMethod
    })
  } catch (error) {
    console.error("Payment method update error:", error)

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

// DELETE - Delete payment method
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params

    // Check if payment method exists and belongs to user
    const existingPaymentMethod = await prisma.withdrawalMethod.findFirst({
      where: {
        id: id,
        userId: userId,
      },
      include: {
        _count: {
          select: {
            withdrawalRequests: true
          }
        }
      }
    })

    if (!existingPaymentMethod) {
      return NextResponse.json(
        { success: false, error: "Payment method not found" },
        { status: 404 }
      )
    }

    // Check if payment method has any withdrawal requests
    if (existingPaymentMethod._count.withdrawalRequests > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete payment method with existing withdrawal requests"
        },
        { status: 400 }
      )
    }

    // Delete the payment method
    await prisma.withdrawalMethod.delete({
      where: {
        id: id,
      }
    })

    return NextResponse.json({
      success: true,
      message: "Payment method deleted successfully"
    })
  } catch (error) {
    console.error("Payment method deletion error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}