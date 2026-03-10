import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');

  try {
    const data = await prisma.diagram_type.findMany({
      where: { company_id: company_id || '' },
    });

    return apiSuccess({ data });
  } catch (error) {
    console.error(error);
    return apiError('Failed to fetch diagram types', 500);
  }
}

export async function POST(request: NextRequest) {
  const { name, color, short_description, work_active } = await request.json();
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');

  try {
    const data = await prisma.diagram_type.create({
      data: { name, company_id: company_id || '', color, short_description, work_active },
    });

    return apiSuccess(data, 201);
  } catch (error) {
    console.error(error);
    return apiError('Failed to create diagram type', 500);
  }
}

export async function PUT(request: NextRequest) {
  const { id, name, color, short_description, work_active } = await request.json();

  try {
    const data = await prisma.diagram_type.update({
      where: { id },
      data: { name, color, short_description, work_active },
    });

    return apiSuccess(data);
  } catch (error) {
    console.error(error);
    return apiError('Failed to update diagram type', 500);
  }
}
