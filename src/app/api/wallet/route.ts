import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - No session" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get or create wallet for the user
    let wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      // Create wallet if it doesn't exist
      wallet = await prisma.wallet.create({
        data: {
          userId,
          balance: 0.0,
          currency: "INR"
        }
      });
    }

    // Get recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        type: true,
        amount: true,
        status: true,
        createdAt: true,
        description: true
      }
    });

    // Get payment statistics
    const payments = await prisma.payment.findMany({
      where: { userId },
      select: {
        amount: true,
        status: true
      }
    });

    const paymentStats = payments.reduce((acc, payment) => {
      const status = payment.status as string;
      if (!acc[status]) {
        acc[status] = { count: 0, totalAmount: 0 };
      }
      acc[status].count++;
      acc[status].totalAmount += payment.amount;
      return acc;
    }, {} as Record<string, { count: number; totalAmount: number }>);

    return NextResponse.json({
      wallet: {
        id: wallet.id,
        balance: wallet.balance,
        currency: wallet.currency,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt
      },
      recentTransactions,
      paymentStats
    });

  } catch (error) {
    console.error("Wallet fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
