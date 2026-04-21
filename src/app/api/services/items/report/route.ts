import { prisma } from '@/shared/lib/prisma';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');

  try {
    const itemsRaw = await prisma.service_items.findMany({
      where: { company_id: company_id || '' },
      include: {
        measure_unit: { select: { id: true, unit: true } },
        customer_service: {
          select: {
            id: true,
            customer: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Remap to match previous response shape
    const items = itemsRaw.map((item: any) => {
      const { measure_unit, customer_service, ...rest } = item;
      return {
        ...rest,
        item_measure_units: measure_unit,
        customer_service_id: customer_service
          ? { id: customer_service.id, customer_id: customer_service.customer }
          : null,
      };
    });

    return apiSuccess({ items });
  } catch (error) {
    console.error(error);
    return apiError('Failed to fetch service items report', 500);
  }
}

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  let company_id = searchParams.get('actual');
  const body = await request.json();
  const { customer_service_id, item_name, item_description, item_measure_units, item_price } = body;
  company_id = company_id ? company_id.replace(/['"]/g, '') : null;

  try {
    const items = await prisma.service_items.create({
      data: {
        customer_service_id: customer_service_id,
        item_name: item_name,
        item_description: item_description,
        item_measure_units: item_measure_units,
        item_price: item_price,
        company_id: company_id || '',
      },
    });

    return apiSuccess({ items }, 201);
  } catch (error: any) {
    console.error('Catch Error:', error);
    return apiError(error.message, 500);
  }
}

export async function PUT(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  const body = await request.json();
  const { item_name, item_description, item_measure_units, item_price, is_active } = body;

  try {
    const items = await prisma.service_items.update({
      where: { id: id || '' },
      data: {
        item_name: item_name,
        item_description: item_description,
        item_measure_units: item_measure_units,
        item_price: item_price,
        is_active: is_active,
      },
    });

    return apiSuccess({ items });
  } catch (error) {
    console.error(error);
    return apiError('Failed to update service item', 500);
  }
}
