import { NextRequest, NextResponse } from "next/server";
import { ReferralService } from "@/lib/referral-service";

// GET /api/referral/base-url - Get referral base URL
export async function GET(request: NextRequest) {
  try {
    const baseUrl = await ReferralService.getReferralBaseUrl();

    return NextResponse.json({
      baseUrl
    });
  } catch (error) {
    console.error("Error fetching referral base URL:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch referral base URL",
        baseUrl: "https://montra.in" // Fallback URL
      },
      { status: 500 }
    );
  }
}