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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const userId = session.user.id;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { userId };

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { referenceId: { contains: search, mode: "insensitive" } },
        { id: { contains: search, mode: "insensitive" } }
      ];
    }

    // Get transactions with pagination
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          amount: true,
          currency: true,
          status: true,
          description: true,
          referenceId: true,
          metadata: true,
          createdAt: true
        }
      }),
      prisma.transaction.count({ where })
    ]);

    // Get transaction statistics
    const stats = await prisma.transaction.groupBy({
      by: ["type", "status"],
      where: { userId },
      _count: { id: true },
      _sum: { amount: true }
    });

    // Calculate totals
    const totalDeposits = stats
      .filter(s => s.type === "DEPOSIT" && s.status === "COMPLETED")
      .reduce((sum, s) => sum + (s._sum.amount || 0), 0);

    const totalWithdrawals = stats
      .filter(s => s.type === "WITHDRAWAL" && s.status === "COMPLETED")
      .reduce((sum, s) => sum + (s._sum.amount || 0), 0);

    const totalRewards = stats
      .filter(s => s.type === "REWARD" && s.status === "COMPLETED")
      .reduce((sum, s) => sum + (s._sum.amount || 0), 0);

    const completedTransactions = stats
      .filter(s => s.status === "COMPLETED")
      .reduce((sum, s) => sum + s._count.id, 0);

    const pendingTransactions = stats
      .filter(s => s.status === "PENDING")
      .reduce((sum, s) => sum + s._count.id, 0);

    const failedTransactions = stats
      .filter(s => s.status === "FAILED")
      .reduce((sum, s) => sum + s._count.id, 0);

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      stats: {
        totalTransactions: total,
        totalDeposits,
        totalWithdrawals,
        totalRewards,
        completedTransactions,
        pendingTransactions,
        failedTransactions,
        netBalance: totalDeposits - totalWithdrawals
      }
    });

  } catch (error) {
    console.error("Transaction fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
