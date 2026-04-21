import { prisma } from '@/shared/lib/prisma';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');

  try {
    const data = await prisma.types_of_repairs.findMany({
      where: { company_id: company_id || '' },
    });

    return apiSuccess({ types_of_repairs: data });
  } catch (error) {
    console.error(error);
    return apiError('Failed to fetch repair types', 500);
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    const types_of_repairs = await prisma.types_of_repairs.create({
      data: body,
    });

    return apiSuccess({ types_of_repairs: [types_of_repairs] }, 201);
  } catch (error) {
    console.error(error);
    return apiError('Failed to create repair type', 500);
  }
}

export async function PUT(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  const body = await request.json();

  try {
    const types_of_repairs = await prisma.types_of_repairs.update({
      where: { id: id || '' },
      data: body,
    });

    return apiSuccess({ types_of_repairs });
  } catch (error) {
    console.error(error);
    return apiError('Failed to update repair type', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  try {
    const types_of_repairs = await prisma.types_of_repairs.delete({
      where: { id: id || '' },
    });

    return apiSuccess({ types_of_repairs });
  } catch (error) {
    console.error(error);
    return apiError('Failed to delete repair type', 500);
  }
}
