import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for creating referral relationship
const createRelationshipSchema = z.object({
  referralCode: z.string().min(1, "Referral code is required"),
  email: z.string().email("Invalid email address")
});

// POST /api/referral/create-relationship - Create referral relationship after signup
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { referralCode, email } = createRelationshipSchema.parse(body);

    // Verify email matches the authenticated user
    if (email !== session.user.email) {
      return NextResponse.json(
        { error: "Email does not match authenticated user" },
        { status: 400 }
      );
    }

    // Find the referral code
    const referralCodeEntry = await prisma.referralCode.findUnique({
      where: { code: referralCode },
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

    if (!referralCodeEntry) {
      return NextResponse.json(
        { error: "Invalid referral code" },
        { status: 404 }
      );
    }

    // Check if referral code is active
    if (!referralCodeEntry.isActive) {
      return NextResponse.json(
        { error: "Referral code is inactive" },
        { status: 400 }
      );
    }

    // Check if referral code has expired
    if (referralCodeEntry.expiresAt && referralCodeEntry.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Referral code has expired" },
        { status: 400 }
      );
    }

    // Check if referral program is active
    const referralSettings = await prisma.referralSettings.findFirst();
    if (!referralSettings?.isActive) {
      return NextResponse.json(
        { error: "Referral program is currently inactive" },
        { status: 400 }
      );
    }

    // Prevent self-referral
    if (session.user.id === referralCodeEntry.userId) {
      return NextResponse.json(
        { error: "Cannot refer yourself" },
        { status: 400 }
      );
    }

    // Check if user already has a referrer
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { referredBy: true }
    });

    if (existingUser?.referredBy) {
      return NextResponse.json(
        { error: "User already has a referrer" },
        { status: 400 }
      );
    }

    // Check if referral relationship already exists
    const existingRelationship = await prisma.referralRelationship.findFirst({
      where: {
        referrerId: referralCodeEntry.userId,
        referredUserId: session.user.id
      }
    });

    if (existingRelationship) {
      return NextResponse.json(
        { error: "Referral relationship already exists" },
        { status: 400 }
      );
    }

    // Check max referrals per user limit
    if (referralSettings.maxReferralsPerUser > 0) {
      const currentReferrals = await prisma.referralRelationship.count({
        where: {
          referrerId: referralCodeEntry.userId,
          status: "COMPLETED"
        }
      });

      if (currentReferrals >= referralSettings.maxReferralsPerUser) {
        return NextResponse.json(
          { error: "This referral code has reached its maximum usage limit" },
          { status: 400 }
        );
      }
    }

    // Create referral relationship
    const referralRelationship = await prisma.referralRelationship.create({
      data: {
        referrerId: referralCodeEntry.userId,
        referredUserId: session.user.id,
        referralCodeId: referralCodeEntry.id,
        status: "PENDING" // Will be completed after user makes first deposit
      },
      include: {
        userAsReferrer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        referralCode: {
          select: {
            code: true
          }
        }
      }
    });

    // Update user's referredBy field
    await prisma.user.update({
      where: { id: session.user.id },
      data: { referredBy: referralCodeEntry.userId }
    });

    return NextResponse.json({
      success: true,
      relationship: {
        id: referralRelationship.id,
        status: referralRelationship.status,
        referrerName: referralRelationship.userAsReferrer.name || referralRelationship.userAsReferrer.email,
        referralCode: referralRelationship.referralCode.code,
        createdAt: referralRelationship.createdAt
      },
      message: "Referral relationship created successfully! Complete your first deposit to activate rewards."
    });

  } catch (error) {
    console.error("Error creating referral relationship:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: error.issues
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create referral relationship" },
      { status: 500 }
    );
  }
}