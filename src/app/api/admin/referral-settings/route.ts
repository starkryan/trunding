import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for updating referral settings
const referralSettingsSchema = z.object({
  isActive: z.boolean().optional(),
  referrerRewardType: z.enum(["FLAT", "PERCENTAGE"]).optional(),
  referrerRewardAmount: z.number().min(0).optional(),
  referrerRewardPercentage: z.number().min(0).max(100).optional(),
  referredRewardType: z.enum(["FLAT", "PERCENTAGE"]).optional(),
  referredRewardAmount: z.number().min(0).optional(),
  referredRewardPercentage: z.number().min(0).max(100).optional(),
  minimumDepositAmount: z.number().min(0).optional(),
  referralCodeExpiryDays: z.number().min(1).optional(),
  maxReferralsPerUser: z.number().min(-1).optional(),
  enableMultiLevel: z.boolean().optional(),
  multiLevelRewards: z.any().optional(),
  referralBaseUrl: z.string().url().optional(),
});

// GET /api/admin/referral-settings - Get referral settings
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user || !session.user.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let settings = await prisma.referralSettings.findFirst();

    // If no settings exist, create default settings
    if (!settings) {
      settings = await prisma.referralSettings.create({
        data: {
          isActive: false,
          referrerRewardType: "FLAT",
          referrerRewardAmount: 50.0,
          referrerRewardPercentage: 5.0,
          referredRewardType: "FLAT",
          referredRewardAmount: 25.0,
          referredRewardPercentage: 2.5,
          minimumDepositAmount: 300.0,
          referralCodeExpiryDays: 30,
          maxReferralsPerUser: -1,
          enableMultiLevel: false,
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching referral settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch referral settings" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/referral-settings - Update referral settings
export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user || !session.user.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = referralSettingsSchema.parse(body);

    // Get existing settings
    let settings = await prisma.referralSettings.findFirst();

    if (!settings) {
      // Create settings if they don't exist
      settings = await prisma.referralSettings.create({
        data: {
          isActive: validatedData.isActive ?? false,
          referrerRewardType: validatedData.referrerRewardType ?? "FLAT",
          referrerRewardAmount: validatedData.referrerRewardAmount ?? 50.0,
          referrerRewardPercentage: validatedData.referrerRewardPercentage ?? 5.0,
          referredRewardType: validatedData.referredRewardType ?? "FLAT",
          referredRewardAmount: validatedData.referredRewardAmount ?? 25.0,
          referredRewardPercentage: validatedData.referredRewardPercentage ?? 2.5,
          minimumDepositAmount: validatedData.minimumDepositAmount ?? 300.0,
          referralCodeExpiryDays: validatedData.referralCodeExpiryDays ?? 30,
          maxReferralsPerUser: validatedData.maxReferralsPerUser ?? -1,
          enableMultiLevel: validatedData.enableMultiLevel ?? false,
          multiLevelRewards: validatedData.multiLevelRewards,
          referralBaseUrl: validatedData.referralBaseUrl ?? "https://montra.in",
        }
      });
    } else {
      // Update existing settings
      settings = await prisma.referralSettings.update({
        where: { id: settings.id },
        data: validatedData
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating referral settings:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update referral settings" },
      { status: 500 }
    );
  }
}