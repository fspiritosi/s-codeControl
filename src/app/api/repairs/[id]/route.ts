import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { NextRequest } from 'next/server';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  try {
    const types_of_repairs = await prisma.types_of_repairs.update({
      where: { id },
      data: body,
    });

    return apiSuccess({ types_of_repairs });
  } catch (error) {
    console.error(error);
    return apiError('Failed to update repair type', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const types_of_repairs = await prisma.types_of_repairs.delete({
      where: { id },
    });

    return apiSuccess({ types_of_repairs });
  } catch (error) {
    console.error(error);
    return apiError('Failed to delete repair type', 500);
  }
}
