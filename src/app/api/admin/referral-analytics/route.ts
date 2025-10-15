import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/referral-analytics - Get referral analytics
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user || !session.user.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '30'; // Default to 30 days

    // Get date range based on period
    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Basic referral stats
    const [
      totalReferrals,
      completedReferrals,
      pendingReferrals,
      totalPayouts,
      activeReferralSettings,
      topReferrers,
      recentReferrals,
      dailyReferrals
    ] = await Promise.all([
      // Total referral relationships
      prisma.referralRelationship.count({
        where: {
          createdAt: { gte: startDate }
        }
      }),

      // Completed referrals
      prisma.referralRelationship.count({
        where: {
          status: "COMPLETED",
          completedAt: { gte: startDate }
        }
      }),

      // Pending referrals
      prisma.referralRelationship.count({
        where: {
          status: "PENDING",
          createdAt: { gte: startDate }
        }
      }),

      // Total payout amount
      prisma.referralPayout.aggregate({
        where: {
          status: "PROCESSED",
          processedAt: { gte: startDate }
        },
        _sum: {
          amount: true
        }
      }),

      // Active referral settings
      prisma.referralSettings.findFirst({
        select: { isActive: true }
      }),

      // Top referrers
      prisma.user.findMany({
        where: {
          successfulReferrals: { gt: 0 }
        },
        select: {
          id: true,
          name: true,
          email: true,
          successfulReferrals: true,
          totalReferralEarnings: true,
          createdAt: true
        },
        orderBy: {
          successfulReferrals: 'desc'
        },
        take: 10
      }),

      // Recent referrals
      prisma.referralRelationship.findMany({
        where: {
          createdAt: { gte: startDate }
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
          completedAt: true,
          userAsReferrer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          userAsReferredUser: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 20
      }),

      // Daily referral counts for the period
      prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
        SELECT
          DATE_TRUNC('day', "createdAt") as date,
          COUNT(*) as count
        FROM "ReferralRelationship"
        WHERE "createdAt" >= ${startDate}
        GROUP BY DATE_TRUNC('day', "createdAt")
        ORDER BY date ASC
      `
    ]);

    // Get daily payout amounts
    const dailyPayouts = await prisma.$queryRaw<Array<{ date: string; amount: string }>>`
      SELECT
        DATE_TRUNC('day', "processedAt") as date,
        SUM(amount) as amount
      FROM "ReferralPayout"
      WHERE status = 'PROCESSED' AND "processedAt" >= ${startDate}
      GROUP BY DATE_TRUNC('day', "processedAt")
      ORDER BY date ASC
    `;

    // Calculate conversion rate
    const conversionRate = totalReferrals > 0
      ? (completedReferrals / totalReferrals) * 100
      : 0;

    // Calculate average referral value
    const avgReferralValue = completedReferrals > 0
      ? (totalPayouts._sum.amount || 0) / completedReferrals
      : 0;

    const analytics = {
      summary: {
        totalReferrals,
        completedReferrals,
        pendingReferrals,
        conversionRate: Math.round(conversionRate * 100) / 100,
        totalPayouts: totalPayouts._sum.amount || 0,
        avgReferralValue: Math.round(avgReferralValue * 100) / 100,
        isReferralProgramActive: activeReferralSettings?.isActive || false
      },
      topReferrers: topReferrers.map(referrer => ({
        ...referrer,
        totalReferralEarnings: Math.round(referrer.totalReferralEarnings * 100) / 100
      })),
      recentReferrals,
      charts: {
        dailyReferrals: dailyReferrals.map(item => ({
          date: new Date(item.date).toISOString().split('T')[0],
          count: Number(item.count)
        })),
        dailyPayouts: dailyPayouts.map(item => ({
          date: new Date(item.date).toISOString().split('T')[0],
          amount: Math.round(parseFloat(item.amount) * 100) / 100
        }))
      },
      period: daysAgo
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching referral analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch referral analytics" },
      { status: 500 }
    );
  }
}