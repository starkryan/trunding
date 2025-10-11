import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Temporary endpoint to create an admin user for testing
export async function POST() {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin@test.com' },
          { role: 'ADMIN' }
        ]
      }
    })

    if (existingAdmin) {
      return NextResponse.json({
        success: false,
        error: "Admin user already exists",
        user: {
          email: existingAdmin.email,
          role: existingAdmin.role,
          id: existingAdmin.id
        }
      })
    }

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@test.com',
        role: 'ADMIN',
        banned: false
      }
    })

    // Create wallet for admin user
    await prisma.wallet.create({
      data: {
        userId: adminUser.id,
        balance: 0,
        currency: 'INR'
      }
    })

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully",
      user: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      }
    })
  } catch (error) {
    console.error("Create admin error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create admin user",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET method to check if admin exists
export async function GET() {
  try {
    const adminUsers = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'SUPER_ADMIN']
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: `Found ${adminUsers.length} admin users`,
      adminUsers
    })
  } catch (error) {
    console.error("Check admin error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check admin users",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}