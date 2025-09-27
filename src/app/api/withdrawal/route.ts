import { NextRequest, NextResponse } from "next/server";
import { getAuthClient } from "@/lib/auth-client";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const authClient = getAuthClient();
    if (!authClient) {
      return NextResponse.json(
        { error: "Authentication service unavailable" },
        { status: 503 }
      );
    }
    const session = await authClient.getSession();
    
    if (!session || !session.data?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { amount, withdrawalMethod } = await request.json();

    // Validate required fields
    if (!amount || !withdrawalMethod) {
      return NextResponse.json(
        { error: "Amount and withdrawal method are required" },
        { status: 400 }
      );
    }

    // Validate amount (minimum $10, maximum $5000)
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 10 || amountNum > 5000) {
      return NextResponse.json(
        { error: "Withdrawal amount must be between $10 and $5,000" },
        { status: 400 }
      );
    }

    // Check if user has withdrawal details
    const withdrawalDetailsResult = await db.execute({
      sql: "SELECT * FROM withdrawal_details WHERE user_id = $1 AND is_active = TRUE",
      args: [session.data.user.id],
    });

    if (withdrawalDetailsResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Please set up your withdrawal details first" },
        { status: 400 }
      );
    }

    const withdrawalDetails = withdrawalDetailsResult.rows[0];

    // Check if user details are verified (in real implementation, this would be more complex)
    if (!withdrawalDetails.is_verified) {
      return NextResponse.json(
        { error: "Your withdrawal details are pending verification" },
        { status: 400 }
      );
    }

    // Generate withdrawal transaction
    const withdrawalRequest = {
      userId: session.data.user.id,
      amount: amountNum,
      withdrawalMethod: withdrawalMethod,
      transactionId: `WD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: "pending",
      withdrawalDetails: {
        fullName: withdrawalDetails.full_name,
        upiId: withdrawalDetails.upi_id,
        bankAccount: withdrawalDetails.bank_account_number,
        phone: withdrawalDetails.phone_number,
        email: withdrawalDetails.email
      },
      createdAt: new Date().toISOString()
    };

    // Simulate withdrawal processing
    // In a real implementation, this would integrate with payment processors
    console.log("Processing withdrawal:", withdrawalRequest);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    return NextResponse.json({
      success: true,
      transactionId: withdrawalRequest.transactionId,
      message: "Withdrawal initiated successfully. You will receive funds within 24-48 hours.",
      estimatedProcessingTime: "24-48 hours"
    });

  } catch (error) {
    console.error("Error processing withdrawal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
