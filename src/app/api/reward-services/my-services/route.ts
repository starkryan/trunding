import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userServices = await prisma.userRewardService.findMany({
      where: { userId: session.user.id },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
      orderBy: { lastCalculated: 'desc' },
    });

    return NextResponse.json(userServices);
  } catch (error) {
    console.error('Error fetching user services:', error);
    return NextResponse.json({ error: 'Failed to fetch user services' }, { status: 500 });
  }
}