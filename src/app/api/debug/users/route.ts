import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Temporary debug endpoint to check database connection and users
export async function GET() {
  try {
    // Test database connection
    const userCount = await prisma.user.count()

    // Get first few users
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    })

    // Get transaction count
    const transactionCount = await prisma.transaction.count()

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      data: {
        userCount,
        transactionCount,
        users: users.map(u => ({
          ...u,
          role: u.role || 'USER'
        }))
      }
    })
  } catch (error) {
    console.error("Debug endpoint error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Database connection failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}