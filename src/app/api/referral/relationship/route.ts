import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ReferralService } from "@/lib/referral-service";
import { z } from "zod";

// Schema for creating referral relationship
const createRelationshipSchema = z.object({
  referralCode: z.string().min(1, "Referral code is required"),
  email: z.string().email("Invalid email address").optional()
});

// POST /api/referral/relationship - Create referral relationship
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
    const { referralCode, email } = createRelationshipSchema.parse(body);

    const success = await ReferralService.createReferralRelationship(
      session.user.id,
      referralCode
    );

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Referral relationship created successfully"
      });
    } else {
      return NextResponse.json(
        { error: "Failed to create referral relationship" },
        { status: 400 }
      );
    }
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