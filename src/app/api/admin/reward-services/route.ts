import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createRewardServiceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  formula: z.string().min(1, 'Formula is required'),
  formulaDisplay: z.string().min(1, 'Display formula is required'),
  exampleAmount: z.number().positive('Example amount must be positive'),
  isActive: z.boolean().default(true),
});

const updateRewardServiceSchema = createRewardServiceSchema.partial().extend({
  id: z.string().min(1, 'ID is required'),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user || !session.user.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const services = await prisma.rewardService.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching reward services:', error);
    return NextResponse.json({ error: 'Failed to fetch reward services' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user || !session.user.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createRewardServiceSchema.parse(body);

    // Test formula calculation
    const testAmount = validatedData.exampleAmount;
    let testReward: number;
    try {
      testReward = eval(validatedData.formula.replace(/amount/g, testAmount.toString()));
    } catch (error) {
      return NextResponse.json({ error: 'Invalid formula' }, { status: 400 });
    }

    const service = await prisma.rewardService.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        formula: validatedData.formula,
        formulaDisplay: validatedData.formulaDisplay,
        exampleAmount: testAmount,
        exampleReward: Number(testReward.toFixed(2)),
        exampleQuota: Number((testAmount + testReward).toFixed(2)),
        isActive: validatedData.isActive,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    console.error('Error creating reward service:', error);
    return NextResponse.json({ error: 'Failed to create reward service' }, { status: 500 });
  }
}