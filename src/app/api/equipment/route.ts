import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');

  if (!company_id) {
    return NextResponse.json({ error: ['Company not found'] });
  }

  try {
    const vehiclesRaw = await prisma.vehicles.findMany({
      where: { company_id },
      include: {
        type_of_vehicle_rel: { select: { name: true } },
        brand_rel: { select: { name: true } },
        model_rel: { select: { name: true } },
      },
    });

    // Remap to match previous response shape
    const equipments = vehiclesRaw.map((v: any) => {
      const { type_of_vehicle_rel, brand_rel, model_rel, ...rest } = v;
      return {
        ...rest,
        types_of_vehicles: type_of_vehicle_rel,
        brand_vehicles: brand_rel,
        model_vehicles: model_rel,
      };
    });

    return NextResponse.json({ equipments });
  } catch (error) {
    console.error('Error fetching equipments:', error);
    return NextResponse.json({ error: ['An error occurred while fetching equipments'] });
  }
}
export async function PATCH(request: NextRequest, context: any) {
  const body = await request.json();

  try {
    const vehicles = await prisma.vehicles.update({
      where: { id: body.vehicle_id },
      data: { condition: body.condition },
    });

    return Response.json({ vehicles });
  } catch (error) {
    console.error(error);
  }
}
