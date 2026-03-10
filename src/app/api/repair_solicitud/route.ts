import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');

  try {
    const dataRaw = await prisma.repair_solicitudes.findMany({
      where: {
        equipment: {
          company_id: company_id || '',
        },
      },
      include: {
        user: true,
        employee: true,
        equipment: {
          include: {
            type_rel: true,
            brand_rel: true,
            model_rel: true,
          },
        },
        reparation_type_rel: true,
        repairlogs: {
          include: {
            employee: true,
            user: true,
          },
        },
      },
    });

    // Remap to match previous response shape
    const repair_solicitudes = dataRaw.map((rs: any) => {
      const { user, employee, equipment, reparation_type_rel, repairlogs, ...rest } = rs;
      return {
        ...rest,
        user_id: user,
        employee_id: employee,
        equipment_id: equipment
          ? {
              ...equipment,
              type: equipment.type_rel,
              brand: equipment.brand_rel,
              model: equipment.model_rel,
            }
          : null,
        reparation_type: reparation_type_rel,
        repairlogs: repairlogs.map((rl: any) => {
          const { employee: rlEmployee, user: rlUser, ...rlRest } = rl;
          return {
            ...rlRest,
            modified_by_employee: rlEmployee,
            modified_by_user: rlUser,
          };
        }),
      };
    });

    return apiSuccess({ repair_solicitudes });
  } catch (error) {
    console.error(error);
    return apiError('Failed to fetch repair solicitudes', 500);
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    const repair_solicitudes = await prisma.repair_solicitudes.create({
      data: body,
    });

    return apiSuccess({ repair_solicitudes: repair_solicitudes ?? {} }, 201);
  } catch (error) {
    console.error(error);
    return apiError('Failed to create repair solicitud', 500);
  }
}

export async function PUT(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  const body = await request.json();

  try {
    const repair_solicitudes = await prisma.repair_solicitudes.update({
      where: { id: id || '' },
      data: body,
    });

    return apiSuccess({ repair_solicitudes });
  } catch (error) {
    console.error(error);
    return apiError('Failed to update repair solicitud', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  try {
    const repair_solicitudes = await prisma.repair_solicitudes.delete({
      where: { id: id || '' },
    });

    return apiSuccess({ repair_solicitudes });
  } catch (error) {
    console.error(error);
    return apiError('Failed to delete repair solicitud', 500);
  }
}
