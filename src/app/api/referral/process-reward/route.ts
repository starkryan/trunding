import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ReferralService } from "@/lib/referral-service";
import { z } from "zod";

// Schema for processing referral rewards
const processRewardSchema = z.object({
  depositAmount: z.number().min(0, "Deposit amount must be positive")
});

// POST /api/referral/process-reward - Process referral reward for user deposit
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { depositAmount } = processRewardSchema.parse(body);

    await ReferralService.processReferralReward(session.user.id, depositAmount);

    return NextResponse.json({
      success: true,
      message: "Referral reward processed successfully"
    });
  } catch (error) {
    console.error("Error processing referral reward:", error);

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
      { error: "Failed to process referral reward" },
      { status: 500 }
    );
  }
}