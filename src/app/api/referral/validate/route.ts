import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for referral validation
const validateReferralSchema = z.object({
  code: z.string().min(1, "Referral code is required").max(20, "Invalid referral code"),
  email: z.string().email("Invalid email address").optional()
});

// POST /api/referral/validate - Validate referral code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, email } = validateReferralSchema.parse(body);

    // Find the referral code
    const referralCode = await prisma.referralCode.findUnique({
      where: { code },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!referralCode) {
      return NextResponse.json(
        {
          valid: false,
          error: "Invalid referral code"
        },
        { status: 404 }
      );
    }

    // Check if referral code is active
    if (!referralCode.isActive) {
      return NextResponse.json(
        {
          valid: false,
          error: "Referral code is inactive"
        },
        { status: 400 }
      );
    }

    // Check if referral code has expired
    if (referralCode.expiresAt && referralCode.expiresAt < new Date()) {
      return NextResponse.json(
        {
          valid: false,
          error: "Referral code has expired"
        },
        { status: 400 }
      );
    }

    // Check if referral program is active
    const referralSettings = await prisma.referralSettings.findFirst();
    if (!referralSettings?.isActive) {
      return NextResponse.json(
        {
          valid: false,
          error: "Referral program is currently inactive"
        },
        { status: 400 }
      );
    }

    // Check if email already exists (prevent self-referral)
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true, referredBy: true }
      });

      if (existingUser) {
        // User already exists
        if (existingUser.referredBy === referralCode.userId) {
          return NextResponse.json(
            {
              valid: false,
              error: "You cannot use this referral code"
            },
            { status: 400 }
          );
        }

        return NextResponse.json(
          {
            valid: false,
            error: "Email already registered"
          },
          { status: 400 }
        );
      }
    }

    // Check max referrals per user limit
    if (referralSettings.maxReferralsPerUser > 0) {
      const currentReferrals = await prisma.referralRelationship.count({
        where: {
          referrerId: referralCode.userId,
          status: "COMPLETED"
        }
      });

      if (currentReferrals >= referralSettings.maxReferralsPerUser) {
        return NextResponse.json(
          {
            valid: false,
            error: "This referral code has reached its maximum usage limit"
          },
          { status: 400 }
        );
      }
    }

    // Return successful validation with referral information
    return NextResponse.json({
      valid: true,
      referralInfo: {
        referrerId: referralCode.userId,
        referrerName: referralCode.user.name || referralCode.user.email,
        referralCodeId: referralCode.id,
        rewards: {
          referrer: {
            type: referralSettings.referrerRewardType,
            amount: referralSettings.referrerRewardType === "FLAT"
              ? referralSettings.referrerRewardAmount
              : `${referralSettings.referrerRewardPercentage}%`
          },
          referred: {
            type: referralSettings.referredRewardType,
            amount: referralSettings.referredRewardType === "FLAT"
              ? referralSettings.referredRewardAmount
              : `${referralSettings.referredRewardPercentage}%`
          }
        },
        minimumDeposit: referralSettings.minimumDepositAmount,
        expiryDate: referralCode.expiresAt
      }
    });
  } catch (error) {
    console.error("Error validating referral code:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          valid: false,
          error: "Invalid request data",
          details: error.issues
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        valid: false,
        error: "Failed to validate referral code"
      },
      { status: 500 }
    );
  }
}