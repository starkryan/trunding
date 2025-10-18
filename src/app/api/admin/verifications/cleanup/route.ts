import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { cleanupExpiredVerifications, getVerificationExpirationStats } from "@/lib/verification-cleanup"
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

    console.log("🧹 [ADMIN] Manual cleanup triggered by admin")

    // Run cleanup
    const result = await cleanupExpiredVerifications()

    return NextResponse.json({
      success: true,
      message: `Successfully cleaned up ${result.cleaned} expired verifications`,
      result
    })

  } catch (error) {
    console.error("Manual cleanup error:", error)
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

    // Get statistics
    const stats = await getVerificationExpirationStats()

    return NextResponse.json({
      success: true,
      stats,
      insights: {
        needsAttention: stats.expiredCount > 0 || stats.expiringNext24h > 0,
        urgencyLevel: stats.expiredCount > 10 ? 'high' : stats.expiredCount > 0 ? 'medium' : 'low'
      }
    })

  } catch (error) {
    console.error("Get verification stats error:", error)
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