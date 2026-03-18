'use server';
import { prisma } from '@/shared/lib/prisma';
import { supabaseServer } from '@/shared/lib/supabase/server';
import { getActionContext } from '@/shared/lib/server-action-context';
import { getActualRole } from '@/shared/lib/utils';

// Vehicle/Equipment-related queries

export const fetchAllEquipmentWithRelations = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.vehicles.findMany({
      where: { company_id: companyId },
      include: {
        brand_rel: true,
        model_rel: true,
        type_rel: true,
        type_of_vehicle_rel: true,
        contractor_equipment: {
          include: { contractor: true },
        },
      },
      orderBy: { domain: 'asc' },
    });
    return data.map(remapVehicle);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return [];
  }
};

// Remap Prisma relation names to match VehicleWithBrand interface
function remapVehicle(v: any) {
  const { brand_rel, model_rel, type_rel, type_of_vehicle_rel, contractor_equipment, ...rest } = v;
  return {
    ...rest,
    brand: brand_rel ?? null,
    model: model_rel ?? null,
    type: type_rel ?? null,
    types_of_vehicles: type_of_vehicle_rel ?? null,
    contractor_equipment: contractor_equipment?.map((ce: any) => ({
      ...ce,
      contractor_id: ce.contractor ?? ce.contractor_id ?? null,
    })) ?? [],
  };
}

export const fetchAllEquipment = async (company_equipment_id?: string) => {
  const { companyId } = await getActionContext();
  if (!companyId && !company_equipment_id) return [];

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = await getActualRole(companyId as string, user?.id as string);

  if (role === 'Invitado') {
    try {
      const data = await prisma.share_company_users.findMany({
        where: {
          profile_id: user?.id || '',
          company_id: (companyId ?? company_equipment_id) || '',
        },
        include: {
          customer: {
            include: {
              contractor_equipment: {
                include: {
                  vehicle: {
                    include: {
                      brand_rel: true,
                      model_rel: true,
                      type_rel: true,
                      type_of_vehicle_rel: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const equipments = data?.[0]?.customer?.contractor_equipment;
      const allEquipments = equipments?.map((equipment) => remapVehicle(equipment.vehicle));
      return allEquipments || [];
    } catch (error) {
      console.error('Error fetching equipment:', error);
      return [];
    }
  }

  try {
    const data = await prisma.vehicles.findMany({
      where: { company_id: (companyId ?? company_equipment_id) || '' },
      include: {
        brand_rel: true,
        model_rel: true,
        type_rel: true,
        type_of_vehicle_rel: true,
        contractor_equipment: {
          include: { contractor: true },
        },
      },
    });
    return data.map(remapVehicle);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return [];
  }
};

export const fetchEquipmentById = async (id: string) => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const vehicleData = await prisma.vehicles.findMany({
      where: { id },
      include: {
        brand_rel: { select: { name: true } },
        model_rel: { select: { name: true } },
        type_of_vehicle_rel: { select: { name: true } },
        type_rel: { select: { name: true } },
      },
    });

    const vehicle = vehicleData?.map((item) => ({
      ...item,
      type_of_vehicle: item.type_of_vehicle_rel.name,
      brand: item.brand_rel.name,
      model: item.model_rel.name,
      type: item.type_rel.name,
    }));
    return vehicle;
  } catch (error) {
    console.error('Error fetching equipment by id:', error);
    return [];
  }
};

export const fetchVehiclesByCompany = async (companyId: string) => {
  if (!companyId) return [];
  try {
    const data = await prisma.vehicles.findMany({
      where: { company_id: companyId },
      include: {
        type_of_vehicle_rel: { select: { name: true } },
        brand_rel: { select: { name: true } },
        model_rel: { select: { name: true } },
      },
    });
    return (data ?? []);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return [];
  }
};
