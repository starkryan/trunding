import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const services = await prisma.rewardService.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        formula: true,
        formulaDisplay: true,
        exampleAmount: true,
        exampleReward: true,
        exampleQuota: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching reward services:', error);
    return NextResponse.json({ error: 'Failed to fetch reward services' }, { status: 500 });
  }
}