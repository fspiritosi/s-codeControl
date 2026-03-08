import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const customer_service_id = searchParams.get('customer_service_id');
  const body = await request.json();
  const { is_active } = body;

  try {
    // Actualizar todos los ítems asociados al customer_service_id de una sola vez
    await prisma.service_items.updateMany({
      where: { customer_service_id: customer_service_id || '' },
      data: { is_active: is_active },
    });

    return new NextResponse(JSON.stringify({ message: 'Items actualizados correctamente' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse(JSON.stringify({ error: error as any }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
