import { NextRequest, NextResponse } from "next/server";
import { authClient } from "@/lib/auth-client";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await authClient.getSession();
    
    if (!session || !session.data?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { fullName, upiId, bankAccount, phone, email } = await request.json();

    // Validate required fields
    if (!fullName || !upiId || !bankAccount || !phone || !email) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if user already has active withdrawal details
    const existingDetails = await prisma.$queryRaw`
      SELECT id FROM withdrawal_details WHERE user_id = ${session.data.user.id} AND is_active = TRUE
    ` as any[];

    if (existingDetails.length > 0) {
      // Update existing details
      await prisma.$executeRaw`
        UPDATE withdrawal_details 
        SET full_name = ${fullName}, upi_id = ${upiId}, bank_account_number = ${bankAccount}, phone_number = ${phone}, email = ${email}, updated_at = NOW()
        WHERE user_id = ${session.data.user.id} AND is_active = TRUE
      `;
    } else {
      // Insert new details
      await prisma.$executeRaw`
        INSERT INTO withdrawal_details (user_id, full_name, upi_id, bank_account_number, phone_number, email)
        VALUES (${session.data.user.id}, ${fullName}, ${upiId}, ${bankAccount}, ${phone}, ${email})
      `;
    }

    return NextResponse.json(
      { message: "Withdrawal details saved successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving withdrawal details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await authClient.getSession();
    
    if (!session || !session.data?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's withdrawal details
    const result = await prisma.$queryRaw`
      SELECT * FROM withdrawal_details WHERE user_id = ${session.data.user.id} AND is_active = TRUE
    ` as any[];

    if (result.length === 0) {
      return NextResponse.json(
        { error: "No withdrawal details found" },
        { status: 404 }
      );
    }

    const details = result[0];
    return NextResponse.json({
      id: details.id,
      fullName: details.full_name,
      upiId: details.upi_id,
      bankAccount: details.bank_account_number,
      phone: details.phone_number,
      email: details.email,
      isVerified: details.is_verified,
    });
  } catch (error) {
    console.error("Error fetching withdrawal details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
