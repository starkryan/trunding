import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const calculateSchema = z.object({
  serviceId: z.string().min(1, 'Service ID is required'),
  amount: z.number().positive('Amount must be positive'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { serviceId, amount } = calculateSchema.parse(body);

    const service = await prisma.rewardService.findUnique({
      where: { id: serviceId, isActive: true },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    let reward: number;
    try {
      reward = eval(service.formula.replace(/amount/g, amount.toString()));
    } catch (error) {
      return NextResponse.json({ error: 'Invalid formula' }, { status: 400 });
    }

    const quota = amount + reward;
    const calculatedReward = Number(reward.toFixed(2));
    const calculatedQuota = Number(quota.toFixed(2));

    // Update user reward service tracking and get the userServiceId
    const userService = await prisma.userRewardService.upsert({
      where: {
        userId_serviceId: {
          userId: session.user.id,
          serviceId: service.id,
        },
      },
      update: {
        totalInvested: { increment: amount },
        totalRewards: { increment: calculatedReward },
        totalQuota: { increment: calculatedQuota },
        calculations: { increment: 1 },
        lastCalculated: new Date(),
      },
      create: {
        userId: session.user.id,
        serviceId: service.id,
        totalInvested: amount,
        totalRewards: calculatedReward,
        totalQuota: calculatedQuota,
        calculations: 1,
        lastCalculated: new Date(),
      },
    });

    // Save calculation to user history
    await prisma.rewardCalculation.create({
      data: {
        userId: session.user.id,
        serviceId: service.id,
        userServiceId: userService.id,
        amount,
        reward: calculatedReward,
        quota: calculatedQuota,
        formula: service.formula,
      },
    });

    return NextResponse.json({
      reward: calculatedReward,
      quota: calculatedQuota,
      formula: service.formulaDisplay,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    console.error('Error calculating reward:', error);
    return NextResponse.json({ error: 'Failed to calculate reward' }, { status: 500 });
  }
}