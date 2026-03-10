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

export const insertVehicle = async (vehicleData: any) => {
  try {
    const data = await prisma.vehicles.create({ data: vehicleData });
    return { data, error: null };
  } catch (error) {
    console.error('Error inserting vehicle:', error);
    return { data: null, error: String(error) };
  }
};

export const updateVehicleById = async (vehicleId: string, updateData: Record<string, unknown>) => {
  try {
    const data = await prisma.vehicles.update({
      where: { id: vehicleId },
      data: updateData as any,
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return { data: null, error: String(error) };
  }
};

export const updateVehicleByIdAndCompany = async (vehicleId: string, companyId: string, updateData: Record<string, unknown>) => {
  try {
    const data = await prisma.vehicles.updateMany({
      where: { id: vehicleId, company_id: companyId },
      data: updateData as any,
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return { data: null, error: String(error) };
  }
};

export const checkVehicleDomainExists = async (domain: string) => {
  try {
    const data = await prisma.vehicles.findMany({
      where: { domain },
    });
    return data;
  } catch (error) {
    console.error('Error checking vehicle domain:', error);
    return [];
  }
};

export const deleteContractorEquipment = async (equipmentId: string, contractorId: string) => {
  try {
    await prisma.contractor_equipment.deleteMany({
      where: { equipment_id: equipmentId, contractor_id: contractorId },
    });
    return { error: null };
  } catch (error) {
    console.error('Error deleting contractor equipment:', error);
    return { error: String(error) };
  }
};

export const insertContractorEquipment = async (equipmentId: string, contractorId: string) => {
  try {
    const data = await prisma.contractor_equipment.create({
      data: { equipment_id: equipmentId, contractor_id: contractorId },
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error inserting contractor equipment:', error);
    return { data: null, error: String(error) };
  }
};

export const insertBrandVehicle = async (name: string) => {
  try {
    const data = await prisma.brand_vehicles.create({ data: { name } });
    return { data, error: null };
  } catch (error) {
    console.error('Error inserting brand vehicle:', error);
    return { data: null, error: String(error) };
  }
};

export const insertModelVehicle = async (name: string, brandId: string) => {
  try {
    const data = await prisma.model_vehicles.create({ data: { name, brand: Number(brandId) || undefined } as any });
    return { data, error: null };
  } catch (error) {
    console.error('Error inserting model vehicle:', error);
    return { data: null, error: String(error) };
  }
};

export const insertTypeVehicle = async (name: string, companyId: string) => {
  try {
    const data = await prisma.type.create({ data: { name, company_id: companyId } });
    return { data, error: null };
  } catch (error) {
    console.error('Error inserting type vehicle:', error);
    return { data: null, error: String(error) };
  }
};

export const fetchVehicleModelsByBrand = async (brandId: string) => {
  try {
    const data = await prisma.model_vehicles.findMany({
      where: { brand: Number(brandId) || undefined },
    });
    return data;
  } catch (error) {
    console.error('Error fetching vehicle models by brand:', error);
    return [];
  }
};

export const reactivateVehicle = async (vehicleId: string, companyId: string) => {
  try {
    const data = await prisma.vehicles.updateMany({
      where: { id: vehicleId, company_id: companyId },
      data: {
        is_active: true,
        termination_date: null,
        reason_for_termination: null,
      } as any,
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error reactivating vehicle:', error);
    return { data: null, error: String(error) };
  }
};

export const deactivateVehicle = async (vehicleId: string, companyId: string, terminationDate: string, reason: string) => {
  try {
    const data = await prisma.vehicles.updateMany({
      where: { id: vehicleId, company_id: companyId },
      data: {
        is_active: false,
        termination_date: terminationDate,
        reason_for_termination: reason,
      } as any,
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error deactivating vehicle:', error);
    return { data: null, error: String(error) };
  }
};

export const updateVehicleAllocatedTo = async (vehicleId: string, allocatedTo: string[]) => {
  try {
    const data = await prisma.vehicles.update({
      where: { id: vehicleId },
      data: { allocated_to: allocatedTo } as any,
    });
    return { data, error: null };
  } catch (error) {
    console.error('Error updating vehicle allocated_to:', error);
    return { data: null, error: String(error) };
  }
};
