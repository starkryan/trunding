import { NextRequest, NextResponse } from "next/server";
import { authClient } from "@/lib/auth-client";
import { db } from "@/lib/db";

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
    const existingDetails = await db.execute({
      sql: "SELECT id FROM withdrawal_details WHERE user_id = $1 AND is_active = TRUE",
      args: [session.data.user.id],
    });

    if (existingDetails.rows.length > 0) {
      // Update existing details
      await db.execute({
        sql: `
          UPDATE withdrawal_details 
          SET full_name = $1, upi_id = $2, bank_account_number = $3, phone_number = $4, email = $5, updated_at = NOW()
          WHERE user_id = $6 AND is_active = TRUE
        `,
        args: [fullName, upiId, bankAccount, phone, email, session.data.user.id],
      });
    } else {
      // Insert new details
      await db.execute({
        sql: `
          INSERT INTO withdrawal_details (user_id, full_name, upi_id, bank_account_number, phone_number, email)
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
        args: [session.data.user.id, fullName, upiId, bankAccount, phone, email],
      });
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
    const result = await db.execute({
      sql: "SELECT * FROM withdrawal_details WHERE user_id = $1 AND is_active = TRUE",
      args: [session.data.user.id],
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "No withdrawal details found" },
        { status: 404 }
      );
    }

    const details = result.rows[0];
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
