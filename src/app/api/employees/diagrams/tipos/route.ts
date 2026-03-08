import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');

  try {
    const data = await prisma.diagram_type.findMany({
      where: { company_id: company_id || '' },
    });

    return Response.json({ data });
  } catch (error) {
    console.error(error);
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

    return Response.json(data);
  } catch (error) {
    console.error(error);
  }
}

export async function PUT(request: NextRequest) {
  const { id, name, color, short_description, work_active } = await request.json();

  try {
    const data = await prisma.diagram_type.update({
      where: { id },
      data: { name, color, short_description, work_active },
    });

    return Response.json(data);
  } catch (error) {
    console.error(error);
  }
}
