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

    // Also get pending payments that don't have corresponding transactions
    const paymentWhere: any = { userId };

    if (search) {
      paymentWhere.OR = [
        { providerOrderId: { contains: search, mode: "insensitive" } },
        { id: { contains: search, mode: "insensitive" } }
      ];
    }

    // Get payments that don't have corresponding transactions
    const pendingPayments = await prisma.payment.findMany({
      where: {
        ...paymentWhere,
        NOT: {
          id: {
            in: await prisma.transaction.findMany({
              where: { userId },
              select: { referenceId: true }
            }).then(txs => txs.map(tx => tx.referenceId).filter(Boolean))
          }
        }
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        providerOrderId: true,
        metadata: true,
        createdAt: true
      }
    });

    // Convert payments to transaction format for display
    const paymentTransactions = pendingPayments.map(payment => ({
      id: payment.id,
      type: "DEPOSIT" as const,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      description: `Payment ${payment.status.toLowerCase()} - Order: ${payment.providerOrderId}`,
      referenceId: payment.id,
      metadata: {
        ...(payment.metadata as Record<string, any> || {}),
        isPayment: true,
        providerOrderId: payment.providerOrderId
      },
      createdAt: payment.createdAt
    }));

    // Also get withdrawal requests that don't have corresponding transactions
    const withdrawalWhere: any = { userId };

    if (status) {
      withdrawalWhere.status = status;
    }

    if (search) {
      withdrawalWhere.OR = [
        { id: { contains: search, mode: "insensitive" } },
        {
          withdrawalMethod: {
            OR: [
              { bankName: { contains: search, mode: "insensitive" } },
              { upiId: { contains: search, mode: "insensitive" } },
              { accountName: { contains: search, mode: "insensitive" } }
            ]
          }
        }
      ];
    }

    // Get withdrawal requests that don't have corresponding transactions
    const pendingWithdrawalRequests = await prisma.withdrawalRequest.findMany({
      where: {
        ...withdrawalWhere,
        NOT: {
          id: {
            in: await prisma.transaction.findMany({
              where: { userId, type: "WITHDRAWAL" },
              select: { referenceId: true }
            }).then(txs => txs.map(tx => tx.referenceId).filter(Boolean))
          }
        }
      },
      orderBy: { createdAt: "desc" },
      include: {
        withdrawalMethod: {
          select: {
            type: true,
            bankName: true,
            upiId: true,
            accountName: true
          }
        }
      }
    });

    // Convert withdrawal requests to transaction format for display
    const withdrawalRequestTransactions = pendingWithdrawalRequests.map(request => ({
      id: request.id,
      type: "WITHDRAWAL" as const,
      amount: request.amount,
      currency: request.currency,
      status: request.status,
      description: `Withdrawal request - ${request.withdrawalMethod.type === 'BANK_ACCOUNT' ? request.withdrawalMethod.bankName || 'Bank Account' : request.withdrawalMethod.upiId || 'UPI'}`,
      referenceId: request.id,
      metadata: {
        ...request,
        isWithdrawalRequest: true,
        withdrawalMethodType: request.withdrawalMethod.type,
        rejectionReason: request.rejectionReason,
        adminNotes: request.adminNotes,
        processedAt: request.processedAt
      },
      createdAt: request.createdAt
    }));

    // Combine transactions, pending payments, and withdrawal requests
    const allTransactions = [...transactions, ...paymentTransactions, ...withdrawalRequestTransactions].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Get transaction statistics
    const stats = await prisma.transaction.groupBy({
      by: ["type", "status"],
      where: { userId },
      _count: { id: true },
      _sum: { amount: true }
    });

    // Calculate totals including withdrawal requests
    const withdrawalRequestStats = await prisma.withdrawalRequest.groupBy({
      by: ["status"],
      where: { userId },
      _count: { id: true },
      _sum: { amount: true }
    });

    const totalDeposits = stats
      .filter(s => s.type === "DEPOSIT" && s.status === "COMPLETED")
      .reduce((sum, s) => sum + (s._sum.amount || 0), 0);

    const totalWithdrawals = stats
      .filter(s => s.type === "WITHDRAWAL" && s.status === "COMPLETED")
      .reduce((sum, s) => sum + (s._sum.amount || 0), 0);

    // Add completed withdrawal requests to total withdrawals
    const completedWithdrawalRequests = withdrawalRequestStats
      .filter(s => s.status === "COMPLETED")
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

    const pendingWithdrawalRequestsCount = withdrawalRequestStats
      .filter(s => s.status === "PENDING")
      .reduce((sum, s) => sum + s._count.id, 0);

    const failedWithdrawalRequestsCount = withdrawalRequestStats
      .filter(s => s.status === "REJECTED" || s.status === "FAILED")
      .reduce((sum, s) => sum + s._count.id, 0);

    const totalItems = total + pendingPayments.length + pendingWithdrawalRequests.length;

    return NextResponse.json({
      transactions: allTransactions,
      pagination: {
        page,
        limit,
        total: totalItems,
        pages: Math.ceil(totalItems / limit),
        hasNext: page * limit < totalItems,
        hasPrev: page > 1
      },
      stats: {
        totalTransactions: totalItems,
        totalDeposits,
        totalWithdrawals: totalWithdrawals + completedWithdrawalRequests,
        totalRewards,
        completedTransactions,
        pendingTransactions: pendingPayments.length + pendingTransactions + pendingWithdrawalRequestsCount,
        failedTransactions: failedTransactions + failedWithdrawalRequestsCount,
        netBalance: totalDeposits - (totalWithdrawals + completedWithdrawalRequests)
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
