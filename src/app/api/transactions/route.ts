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

    // Get transactions without filtering first (we'll filter after combining)
    const [transactions, totalTransactions] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          amount: true,
          currency: true,
          status: true,
          verificationStatus: true,
          description: true,
          referenceId: true,
          metadata: true,
          createdAt: true
        }
      }),
      prisma.transaction.count({ where: { userId } })
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
    // Exclude payments that already have transactions created (especially for reward services)
    const existingTransactionReferences = await prisma.transaction.findMany({
      where: { userId },
      select: { referenceId: true }
    }).then(txs => txs.map(tx => tx.referenceId).filter(Boolean));

    // Also get payments that have reward service transactions with metadata linking to the payment
    const transactionsWithMetadata = await prisma.transaction.findMany({
      where: { userId },
      select: {
        metadata: true
      }
    });

    // Extract payment IDs from transaction metadata
    const rewardServicePaymentIds = [...new Set(
      transactionsWithMetadata
        .map(tx => {
          // Type guard to ensure metadata is an object with paymentId property
          const metadata = tx.metadata;
          if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
            return (metadata as any).paymentId;
          }
          return null;
        })
        .filter(Boolean)
    )];

    // Combine both sets of payment IDs that should be excluded
    const excludePaymentIds = [...new Set([...existingTransactionReferences, ...rewardServicePaymentIds])];

    const pendingPayments = await prisma.payment.findMany({
      where: {
        ...paymentWhere,
        ...(excludePaymentIds.length > 0 && {
          id: {
            notIn: excludePaymentIds
          }
        })
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
      status: payment.status === "COMPLETED" ? "COMPLETED" : payment.status,
      verificationStatus: "NONE" as const,
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
      verificationStatus: "NONE" as const,
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
    let allTransactions = [...transactions, ...paymentTransactions, ...withdrawalRequestTransactions].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Apply filters to the combined dataset
    if (type && type !== "all") {
      allTransactions = allTransactions.filter(tx => tx.type === type);
    }

    if (status && status !== "all") {
      allTransactions = allTransactions.filter(tx => tx.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      allTransactions = allTransactions.filter(tx => {
        // Type guard for metadata
        const metadata = tx.metadata;
        const metadataObj = metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata as any : null;

        return (
          tx.description?.toLowerCase().includes(searchLower) ||
          tx.referenceId?.toLowerCase().includes(searchLower) ||
          tx.id.toLowerCase().includes(searchLower) ||
          (metadataObj?.isWithdrawalRequest && (
            metadataObj.withdrawalMethod?.bankName?.toLowerCase().includes(searchLower) ||
            metadataObj.withdrawalMethod?.upiId?.toLowerCase().includes(searchLower) ||
            metadataObj.withdrawalMethod?.accountName?.toLowerCase().includes(searchLower)
          )) ||
          (metadataObj?.isPayment && metadataObj.providerOrderId?.toLowerCase().includes(searchLower))
        );
      });
    }

    // Apply pagination to the filtered results
    const total = allTransactions.length;
    const paginatedTransactions = allTransactions.slice(skip, skip + limit);

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

    const totalItems = total;

    return NextResponse.json({
      transactions: paginatedTransactions,
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
