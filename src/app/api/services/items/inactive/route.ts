import { prisma } from '@/shared/lib/prisma';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { NextRequest } from 'next/server';

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

    return apiSuccess({ message: 'Items actualizados correctamente' });
  } catch (error) {
    console.error(error);
    return apiError('Failed to update items', 500);
  }
}
