'use server';
import { prisma } from '@/lib/prisma';
import { getActionContext } from '@/lib/server-action-context';

export const UpdateVehicle = async (vehicleId: string, vehicleData: any) => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];
  try {
    await prisma.vehicles.update({
      where: { id: vehicleId },
      data: vehicleData,
    });
  } catch (error) {
    console.error(error);
  }
};
