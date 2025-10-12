import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { z } from "zod";

const adjustBalanceSchema = z.object({
  action: z.enum(['add', 'subtract', 'set']),
  amount: z.number().min(0, "Amount must be positive"),
  reason: z.string().min(1, "Reason is required").max(500, "Reason too long")
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.session?.userId || !session.user || !session.user.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive" as const
          }
        },
        {
          email: {
            contains: search,
            mode: "insensitive" as const
          }
        },
      ];
    }

    if (status) {
      where.banned = status === 'banned';
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          role: true,
          banned: true,
          banReason: true,
          banExpires: true,
          createdAt: true,
          updatedAt: true,
          wallet: {
            select: {
              id: true,
              balance: true,
              currency: true,
              createdAt: true,
              updatedAt: true
            }
          },
          _count: {
            select: {
              sessions: true,
              accounts: true,
              transaction: true,
              withdrawalRequest: true
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Calculate additional stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        // Get transaction stats
        const transactionStats = await prisma.transaction.groupBy({
          by: ['type', 'status'],
          where: { userId: user.id },
          _sum: { amount: true },
          _count: { id: true }
        });

        let totalDeposits = 0;
        let totalWithdrawals = 0;
        let pendingWithdrawals = 0;

        transactionStats.forEach(stat => {
          if (stat.status === 'COMPLETED') {
            if (stat.type === 'DEPOSIT' || stat.type === 'REWARD') {
              totalDeposits += stat._sum.amount || 0;
            } else if (stat.type === 'WITHDRAWAL') {
              totalWithdrawals += stat._sum.amount || 0;
            }
          } else if (stat.status === 'PENDING' && stat.type === 'WITHDRAWAL') {
            pendingWithdrawals += stat._sum.amount || 0;
          }
        });

        return {
          ...user,
          stats: {
            totalDeposits,
            totalWithdrawals,
            pendingWithdrawals,
            availableBalance: (user.wallet?.balance || 0) - pendingWithdrawals,
            netFlow: totalDeposits - totalWithdrawals
          }
        };
      })
    );

    return NextResponse.json({
      success: true,
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user || !session.user.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Prevent self-deletion for security reasons
    if (userId === session.user.id) {
      return NextResponse.json({ error: "Cannot delete your own account for security reasons" }, { status: 400 });
    }

    // Delete user and all related data
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.session?.userId || !session.user || !session.user.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminId = session.session.userId
    const body = await request.json();
    const { action, userId } = body;

    if (!action || !userId) {
      return NextResponse.json({ error: "Action and userId are required" }, { status: 400 });
    }

    // Prevent self-modification for balance adjustments, but allow role changes
    // Super admins can modify other aspects of their account but not their own balance for security reasons
    if (userId === adminId && action === 'adjust_balance') {
      return NextResponse.json({ error: "Cannot modify your own account balance for security reasons" }, { status: 400 });
    }

    if (action === 'adjust_balance') {
      // Validate balance adjustment request
      const { adjustmentType, amount, reason } = body;
      const validatedData = adjustBalanceSchema.parse({ action: adjustmentType, amount, reason });

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { wallet: true }
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Use transaction to ensure atomic operation
      const result = await prisma.$transaction(async (tx) => {
        // Get or create wallet if it doesn't exist
        const wallet = await tx.wallet.upsert({
          where: { userId: userId },
          update: {},
          create: {
            userId: userId,
            balance: 0,
            currency: "INR"
          }
        });

        let newBalance = wallet.balance;
        let transactionType: string;

        if (validatedData.action === 'add') {
          newBalance += validatedData.amount;
          transactionType = 'DEPOSIT';
        } else if (validatedData.action === 'subtract') {
          if (newBalance < validatedData.amount) {
            throw new Error("Insufficient balance for subtraction");
          }
          newBalance -= validatedData.amount;
          transactionType = 'WITHDRAWAL';
        } else if (validatedData.action === 'set') {
          const difference = validatedData.amount - wallet.balance;
          newBalance = validatedData.amount;
          transactionType = difference >= 0 ? 'DEPOSIT' : 'WITHDRAWAL';
        } else {
          throw new Error("Invalid action");
        }

        // Update wallet balance
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: newBalance }
        });

        // Create transaction record
        await tx.transaction.create({
          data: {
            userId: userId,
            walletId: wallet.id,
            amount: validatedData.action === 'set' ? Math.abs(validatedData.amount - wallet.balance) : validatedData.amount,
            currency: wallet.currency,
            type: transactionType as any,
            status: "COMPLETED",
            description: `Admin balance ${validatedData.action}: ${validatedData.reason}`,
            metadata: {
              adminId,
              action: validatedData.action,
              reason: validatedData.reason,
              previousBalance: wallet.balance,
              newBalance: newBalance
            }
          }
        });

        return { wallet, newBalance };
      });

      return NextResponse.json({
        success: true,
        message: "Balance adjusted successfully",
        newBalance: result.newBalance
      });

    } else {
      // Handle regular user updates (role, ban status)
      const { role, banned, banReason } = body;

      const updateData: any = {
        role: role !== undefined ? role : undefined,
        banned: banned !== undefined ? banned : undefined,
      };

      // Only include banReason if we're banning the user
      if (banned === true && banReason) {
        updateData.banReason = banReason;
      }

      // Clear banReason if unbanning
      if (banned === false) {
        updateData.banReason = null;
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          banned: true,
          banReason: true,
          updatedAt: true,
        },
      });

      return NextResponse.json({
        success: true,
        user: updatedUser
      });
    }
  } catch (error) {
    console.error("Error updating user:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}