import { prisma } from '@/shared/lib/prisma';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { serializeBigInt } from '@/shared/lib/utils';
import {
  recalculateVehicleCondition,
  findConflictingOpenRepairs,
} from '@/modules/maintenance/features/repairs/actions.server';
import { buildRepairConflictMessage } from '@/modules/maintenance/features/repairs/repairRules';
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
          orderBy: { created_at: 'desc' },
          take: 15,
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

    return apiSuccess({ repair_solicitudes: serializeBigInt(repair_solicitudes) });
  } catch (error) {
    console.error(error);
    return apiError('Failed to fetch repair solicitudes', 500);
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    // --- Guard: no permitir un pedido de reparación si la unidad ya tiene uno
    // del mismo tipo sin resolver (tarea 380). Aplica a todos los puntos de carga
    // porque todos pasan por este endpoint. ---
    const items: any[] = Array.isArray(body) ? body : [body];
    const pairs = items
      .filter((it) => it?.equipment_id && it?.reparation_type)
      .map((it) => ({ equipment_id: it.equipment_id as string, reparation_type: it.reparation_type as string }));

    // 1. Duplicados dentro del mismo payload (mismo equipo + tipo repetido).
    const seen = new Set<string>();
    for (const p of pairs) {
      const key = `${p.equipment_id}::${p.reparation_type}`;
      if (seen.has(key)) {
        return apiError(
          'No es posible crear la solicitud: cargaste dos veces el mismo tipo de reparación para la misma unidad.',
          409,
        );
      }
      seen.add(key);
    }

    // 2. Conflictos con solicitudes abiertas ya existentes en la base.
    const conflicts = await findConflictingOpenRepairs(pairs);
    if (conflicts.length > 0) {
      const message = buildRepairConflictMessage(
        conflicts.map((c: any) => ({
          unit: c.equipment?.domain || c.equipment?.serie || 'sin dominio',
          typeName: c.reparation_type_rel?.name ?? 'desconocido',
          state: c.state,
        })),
      );
      return apiError(message, 409);
    }

    if (Array.isArray(body)) {
      const result = await prisma.repair_solicitudes.createMany({ data: body });

      // Recalcular condition de cada vehículo afectado (único por equipment_id)
      const affectedVehicleIds = Array.from(
        new Set(body.map((r: any) => r.equipment_id).filter(Boolean))
      );
      await Promise.all(affectedVehicleIds.map((id) => recalculateVehicleCondition(id as string)));

      return apiSuccess({ repair_solicitudes: { count: result.count } }, 201);
    }

    const repair_solicitudes = await prisma.repair_solicitudes.create({
      data: body,
    });

    if (repair_solicitudes.equipment_id) {
      await recalculateVehicleCondition(repair_solicitudes.equipment_id);
    }

    return apiSuccess({ repair_solicitudes: serializeBigInt(repair_solicitudes ?? {}) }, 201);
  } catch (error) {
    console.error('Error creating repair solicitud:', error);
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

    // Si cambió el state, recalcular la condición del vehículo
    if (body?.state && repair_solicitudes.equipment_id) {
      await recalculateVehicleCondition(repair_solicitudes.equipment_id);
    }

    return apiSuccess({ repair_solicitudes: serializeBigInt(repair_solicitudes) });
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

    // Al eliminar una solicitud, recalcular condition del vehículo afectado
    if (repair_solicitudes.equipment_id) {
      await recalculateVehicleCondition(repair_solicitudes.equipment_id);
    }

    return apiSuccess({ repair_solicitudes: serializeBigInt(repair_solicitudes) });
  } catch (error) {
    console.error(error);
    return apiError('Failed to delete repair solicitud', 500);
  }
}
