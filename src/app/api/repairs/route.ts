import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');

  try {
    const data = await prisma.types_of_repairs.findMany({
      where: { company_id: company_id || '' },
    });

    return Response.json({ types_of_repairs: data });
  } catch (error) {
    console.log(error);
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    const types_of_repairs = await prisma.types_of_repairs.create({
      data: body,
    });

    return Response.json({ types_of_repairs: [types_of_repairs] });
  } catch (error) {
    console.log(error);
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

    return Response.json({ types_of_repairs });
  } catch (error) {
    console.log(error);
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  try {
    const types_of_repairs = await prisma.types_of_repairs.delete({
      where: { id: id || '' },
    });

    return Response.json({ types_of_repairs });
  } catch (error) {
    console.log(error);
  }
}
