import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Generate unique referral code
function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET /api/referral/code - Get user's referral code
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if user already has a referral code
    let referralCode = await prisma.referralCode.findUnique({
      where: { userId }
    });

    // If no referral code exists, create one
    if (!referralCode) {
      let code: string;
      let attempts = 0;
      const maxAttempts = 10;

      do {
        code = generateReferralCode();
        attempts++;

        // Check if code already exists
        const existing = await prisma.referralCode.findUnique({
          where: { code }
        });

        if (!existing) break;
      } while (attempts < maxAttempts);

      if (attempts >= maxAttempts) {
        return NextResponse.json(
          { error: "Failed to generate unique referral code" },
          { status: 500 }
        );
      }

      // Get referral settings to determine expiry
      const settings = await prisma.referralSettings.findFirst();
      const expiryDays = settings?.referralCodeExpiryDays || 30;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);

      referralCode = await prisma.referralCode.create({
        data: {
          userId,
          code: code!,
          expiresAt
        }
      });

      // Update user's referral code field
      await prisma.user.update({
        where: { id: userId },
        data: { referralCode: code! }
      });
    }

    // Get referral stats
    const [
      totalReferrals,
      completedReferrals,
      pendingReferrals,
      totalEarnings,
      referralRelationships
    ] = await Promise.all([
      prisma.referralRelationship.count({
        where: { referrerId: userId }
      }),
      prisma.referralRelationship.count({
        where: { referrerId: userId, status: "COMPLETED" }
      }),
      prisma.referralRelationship.count({
        where: { referrerId: userId, status: "PENDING" }
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { totalReferralEarnings: true }
      }),
      prisma.referralRelationship.findMany({
        where: { referrerId: userId },
        select: {
          id: true,
          status: true,
          createdAt: true,
          completedAt: true,
          userAsReferredUser: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true
            }
          },
          referralPayout: {
            select: {
              amount: true,
              type: true,
              status: true,
              processedAt: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    // Transform data to match frontend expectations
    const transformedReferrals = referralRelationships.map(relationship => ({
      id: relationship.id,
      status: relationship.status,
      createdAt: relationship.createdAt,
      completedAt: relationship.completedAt,
      referredUser: relationship.userAsReferredUser,
      payouts: relationship.referralPayout
    }));

    return NextResponse.json({
      referralCode: {
        code: referralCode.code,
        isActive: referralCode.isActive,
        expiresAt: referralCode.expiresAt
      },
      stats: {
        totalReferrals,
        completedReferrals,
        pendingReferrals,
        totalEarnings: totalEarnings?.totalReferralEarnings || 0
      },
      recentReferrals: transformedReferrals
    });
  } catch (error) {
    console.error("Error fetching referral code:", error);
    return NextResponse.json(
      { error: "Failed to fetch referral code" },
      { status: 500 }
    );
  }
}

// POST /api/referral/code - Create new referral code
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if user already has an active referral code
    const existingCode = await prisma.referralCode.findUnique({
      where: { userId }
    });

    if (existingCode && existingCode.isActive && (!existingCode.expiresAt || existingCode.expiresAt > new Date())) {
      return NextResponse.json(
        { error: "User already has an active referral code" },
        { status: 400 }
      );
    }

    // Generate new code
    let code: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      code = generateReferralCode();
      attempts++;

      const existing = await prisma.referralCode.findUnique({
        where: { code }
      });

      if (!existing) break;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: "Failed to generate unique referral code" },
        { status: 500 }
      );
    }

    // Get referral settings
    const settings = await prisma.referralSettings.findFirst();
    const expiryDays = settings?.referralCodeExpiryDays || 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    // Create or update referral code
    const referralCode = await prisma.referralCode.upsert({
      where: { userId },
      update: {
        code: code!,
        isActive: true,
        expiresAt
      },
      create: {
        userId,
        code: code!,
        expiresAt
      }
    });

    // Update user's referral code field
    await prisma.user.update({
      where: { id: userId },
      data: { referralCode: code! }
    });

    return NextResponse.json({
      referralCode: {
        code: referralCode.code,
        isActive: referralCode.isActive,
        expiresAt: referralCode.expiresAt
      }
    });
  } catch (error) {
    console.error("Error creating referral code:", error);
    return NextResponse.json(
      { error: "Failed to create referral code" },
      { status: 500 }
    );
  }
}