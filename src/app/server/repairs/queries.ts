'use server';
import { prisma } from '@/lib/prisma';
import { getActionContext } from '@/lib/server-action-context';

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

export const fetchAllRepairsJUSTEXAMPLE = async () => {
  try {
    const data = await prisma.repair_solicitudes.findMany();
    return data;
  } catch (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
};
