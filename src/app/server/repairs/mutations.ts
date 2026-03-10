'use server';
import { prisma } from '@/lib/prisma';

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
