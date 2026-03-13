'use server';
import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';

// Repair-related queries

export const fetchAllOpenRepairRequests = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.repair_solicitudes.findMany({
      where: {
        equipment: { company_id: companyId },
        state: { in: ['Pendiente', 'Esperando_repuestos', 'En_reparacion'] },
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
    return data as any[];
  } catch (error) {
    console.error('Error fetching open repair requests:', error);
    return [];
  }
};

export const fetchRepairRequestsByEquipmentId = async (equipmentId: string) => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.repair_solicitudes.findMany({
      where: {
        equipment_id: equipmentId,
        state: { in: ['Pendiente', 'Esperando_repuestos', 'En_reparacion'] },
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
    return data as any[];
  } catch (error) {
    console.error('Error fetching repair requests by equipment ID:', error);
    return [];
  }
};

// Repair mutations

export const fetchOpenRepairsByEquipmentIdsAndType = async (
  equipmentIds: string[],
  reparationTypeId: string
) => {
  try {
    const data = await prisma.repair_solicitudes.findMany({
      where: {
        equipment_id: { in: equipmentIds },
        reparation_type: reparationTypeId,
        state: { notIn: ['Cancelado', 'Finalizado', 'Rechazado'] },
      },
      include: { equipment: true },
    });
    return data;
  } catch (error) {
    console.error('Error fetching open repairs by equipment ids:', error);
    return [];
  }
};

export const fetchOpenRepairsByEquipmentAndType = async (
  equipmentId: string,
  reparationTypeId: string
) => {
  try {
    const data = await prisma.repair_solicitudes.findMany({
      where: {
        equipment_id: equipmentId,
        reparation_type: reparationTypeId,
        state: { notIn: ['Cancelado', 'Finalizado', 'Rechazado'] },
      },
    });
    return data;
  } catch (error) {
    console.error('Error fetching open repairs:', error);
    return [];
  }
};

export const fetchRepairSolicitudesByEquipment = async (equipmentId: string) => {
  try {
    const data = await prisma.repair_solicitudes.findMany({
      where: { equipment_id: equipmentId },
      include: {
        reparation_type_rel: true,
        user: true,
        employee: true,
      },
    });
    return data;
  } catch (error) {
    console.error('Error fetching repair solicitudes by equipment:', error);
    return [];
  }
};

export const updateRepairSolicitude = async (
  id: string,
  updateData: Record<string, unknown>
) => {
  try {
    const data = await prisma.repair_solicitudes.update({
      where: { id },
      data: updateData as any,
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error updating repair solicitude:', error);
    return { data: null, error: String(error) };
  }
};
