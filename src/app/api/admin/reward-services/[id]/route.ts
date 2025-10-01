import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateRewardServiceSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  formula: z.string().min(1).optional(),
  formulaDisplay: z.string().min(1).optional(),
  exampleAmount: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user || !session.user.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const service = await prisma.rewardService.findUnique({
      where: { id },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error('Error fetching reward service:', error);
    return NextResponse.json({ error: 'Failed to fetch reward service' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user || !session.user.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateRewardServiceSchema.parse(body);

    const { id } = await params;
    const existingService = await prisma.rewardService.findUnique({
      where: { id },
    });

    if (!existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Test formula if provided
    let exampleReward = existingService.exampleReward;
    let exampleQuota = existingService.exampleQuota;
    let exampleAmount = existingService.exampleAmount;

    if (validatedData.formula && validatedData.exampleAmount) {
      try {
        const testReward = eval(validatedData.formula.replace(/amount/g, validatedData.exampleAmount.toString()));
        exampleReward = Number(testReward.toFixed(2));
        exampleQuota = Number((validatedData.exampleAmount + testReward).toFixed(2));
        exampleAmount = validatedData.exampleAmount;
      } catch (error) {
        return NextResponse.json({ error: 'Invalid formula' }, { status: 400 });
      }
    }

    const service = await prisma.rewardService.update({
      where: { id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.description && { description: validatedData.description }),
        ...(validatedData.formula && { formula: validatedData.formula }),
        ...(validatedData.formulaDisplay && { formulaDisplay: validatedData.formulaDisplay }),
        ...(validatedData.exampleAmount !== undefined && { exampleAmount }),
        ...(validatedData.formula && { exampleReward }),
        ...(validatedData.formula && { exampleQuota }),
        ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
      },
    });

    return NextResponse.json(service);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    console.error('Error updating reward service:', error);
    return NextResponse.json({ error: 'Failed to update reward service' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user || !session.user.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.rewardService.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting reward service:', error);
    return NextResponse.json({ error: 'Failed to delete reward service' }, { status: 500 });
  }
}