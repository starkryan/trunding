import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const tradeSchema = z.object({
  type: z.enum(["buy", "sell"]),
  amount: z.number().positive("Amount must be positive"),
  cryptocurrency: z.string().min(1, "Cryptocurrency is required"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = tradeSchema.parse(body);

    // Get user's wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.userId },
    });

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet not found" },
        { status: 404 }
      );
    }

    // Check balance for buy orders
    if (validatedData.type === "buy" && validatedData.amount > wallet.balance) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // For demo purposes, we'll simulate a successful trade
    // In a real implementation, you would:
    // 1. Check real-time cryptocurrency prices
    // 2. Execute the trade on an exchange
    // 3. Update the wallet balance
    // 4. Create trade records

    // Simulate trade execution
    const tradeAmount = validatedData.amount;
    const fee = tradeAmount * 0.001; // 0.1% fee
    const totalAmount = validatedData.type === "buy" ? tradeAmount + fee : tradeAmount - fee;

    // Update wallet balance
    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: validatedData.type === "buy"
          ? wallet.balance - totalAmount
          : wallet.balance + tradeAmount,
      },
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: session.userId,
        walletId: wallet.id,
        amount: tradeAmount,
        currency: "INR",
        type: validatedData.type.toUpperCase() as any,
        status: "COMPLETED",
        description: `${validatedData.type.toUpperCase()} ${validatedData.cryptocurrency}`,
        referenceId: `trade_${Date.now()}`,
        metadata: {
          cryptocurrency: validatedData.cryptocurrency,
          fee: fee,
          type: validatedData.type,
        },
      },
    });

    return NextResponse.json({
      success: true,
      trade: {
        type: validatedData.type,
        amount: tradeAmount,
        cryptocurrency: validatedData.cryptocurrency,
        fee: fee,
        totalAmount: totalAmount,
        newBalance: updatedWallet.balance,
      },
    });
  } catch (error) {
    console.error("Trade execution error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
