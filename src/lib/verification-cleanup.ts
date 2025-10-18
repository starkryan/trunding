import { prisma } from "@/lib/prisma"

/**
 * Cleanup expired verifications by resetting them to NONE status
 * This should be run periodically (e.g., daily cron job)
 *
 * IMPORTANT: Only verification submissions expire, not the transactions themselves
 * Users can always resubmit verification for pending transactions regardless of age
 */
export async function cleanupExpiredVerifications() {
  try {
    console.log("🧹 [CLEANUP] Starting expired verification cleanup...")

    // Find all expired pending verifications (only the submissions expire)
    const expiredTransactions = await prisma.transaction.findMany({
      where: {
        verificationStatus: 'PENDING_VERIFICATION',
        verificationExpiresAt: {
          lt: new Date()
        }
      },
      select: {
        id: true,
        userId: true,
        amount: true,
        utrNumber: true,
        verificationExpiresAt: true,
        verificationSubmittedAt: true,
        createdAt: true,
        metadata: true
      }
    })

    if (expiredTransactions.length === 0) {
      console.log("🧹 [CLEANUP] No expired verifications found")
      return { cleaned: 0 }
    }

    console.log(`🧹 [CLEANUP] Found ${expiredTransactions.length} expired verification submissions`)

    // Reset expired verifications to allow resubmission
    const result = await prisma.transaction.updateMany({
      where: {
        verificationStatus: 'PENDING_VERIFICATION',
        verificationExpiresAt: {
          lt: new Date()
        }
      },
      data: {
        verificationStatus: 'NONE',
        verificationSubmittedAt: null,
        verificationExpiresAt: null,
        utrNumber: null,
        screenshotUrl: null,
        adminNotes: null,
        verificationRejectedReason: null,
        metadata: {
          verificationExpired: true,
          expiredAt: new Date().toISOString(),
          cleanupType: 'automatic',
          originalSubmission: {
            submittedAt: expiredTransactions[0]?.verificationSubmittedAt?.toISOString(),
            expiredAt: expiredTransactions[0]?.verificationExpiresAt?.toISOString(),
            transactionAge: Math.floor((Date.now() - new Date(expiredTransactions[0]?.createdAt || 0).getTime()) / (1000 * 60 * 60 * 24))
          }
        }
      }
    })

    console.log(`🧹 [CLEANUP] Reset ${result.count} expired verification submissions to allow resubmission`)

    // Log details for audit
    expiredTransactions.forEach(transaction => {
      const transactionAge = Math.floor((Date.now() - new Date(transaction.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      console.log(`🧹 [CLEANUP] Reset verification for transaction ${transaction.id} (₹${transaction.amount}, ${transactionAge} days old) - user can resubmit`)
    })

    return {
      cleaned: result.count,
      details: expiredTransactions.map(t => ({
        transactionId: t.id,
        userId: t.userId,
        amount: t.amount,
        transactionAge: Math.floor((Date.now() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
        expiredAt: t.verificationExpiresAt,
        daysSinceSubmission: Math.floor((Date.now() - new Date(t.verificationSubmittedAt || 0).getTime()) / (1000 * 60 * 60 * 24))
      }))
    }

  } catch (error) {
    console.error("🧹 [CLEANUP] Error cleaning up expired verifications:", error)
    throw error
  }
}

/**
 * Get statistics about verification expirations
 */
export async function getVerificationExpirationStats() {
  try {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const [
      totalPending,
      expiredCount,
      expiringNext24h,
      expiringNext7d
    ] = await Promise.all([
      // Total pending verifications
      prisma.transaction.count({
        where: {
          verificationStatus: 'PENDING_VERIFICATION'
        }
      }),
      // Already expired but not yet cleaned up
      prisma.transaction.count({
        where: {
          verificationStatus: 'PENDING_VERIFICATION',
          verificationExpiresAt: {
            lt: now
          }
        }
      }),
      // Expiring in next 24 hours
      prisma.transaction.count({
        where: {
          verificationStatus: 'PENDING_VERIFICATION',
          verificationExpiresAt: {
            gte: now,
            lte: tomorrow
          }
        }
      }),
      // Expiring in next 7 days
      prisma.transaction.count({
        where: {
          verificationStatus: 'PENDING_VERIFICATION',
          verificationExpiresAt: {
            gte: now,
            lte: nextWeek
          }
        }
      })
    ])

    return {
      totalPending,
      expiredCount,
      expiringNext24h,
      expiringNext7d
    }

  } catch (error) {
    console.error("📊 [STATS] Error getting verification stats:", error)
    throw error
  }
}