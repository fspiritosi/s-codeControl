'use server';
import { prisma } from '@/lib/prisma';
// TODO: Phase 8 — migrate auth to NextAuth
import { supabaseServer } from '@/lib/supabase/server';
import { getActionContext } from '@/lib/server-action-context';
import { getActualRole } from '@/lib/utils';
import { fetchCustomers } from '../company/queries';

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
    return data;
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return [];
  }
};

export const fetchVehicleBrands = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.brand_vehicles.findMany({
      where: { is_active: true, company_id: companyId },
    });
    return data;
  } catch (error) {
    console.error('Error fetching vehicle brands:', error);
    return [];
  }
};

export const fetchVehicleModels = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.model_vehicles.findMany({
      where: { is_active: true },
    });
    return data;
  } catch (error) {
    console.error('Error fetching vehicle models:', error);
    return [];
  }
};

export const fetchTypeVehicles = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.type.findMany({
      where: { is_active: true, company_id: companyId },
      orderBy: { name: 'asc' },
    });
    return data;
  } catch (error) {
    console.error('Error fetching vehicle types:', error);
    return [];
  }
};

export const fetchTypesOfVehicles = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.types_of_vehicles.findMany({
      where: { is_active: true },
    });
    return data;
  } catch (error) {
    console.error('Error fetching types of vehicles:', error);
    return [];
  }
};

export const setVehicleDataOptions = async () => {
  const brands = await fetchVehicleBrands();
  const models = await fetchVehicleModels();
  const types = await fetchTypeVehicles();
  const typesOfVehicles = await fetchTypesOfVehicles();
  const customers = await fetchCustomers();

  return {
    brand: brands.map((brand) => brand.name!),
    model: models.map((model) => model.name!),
    type: types.map((type) => type.name!),
    types_of_vehicles: typesOfVehicles.map((type) => type.name!),
    contractor_equipment: customers.map((customer) => customer.name!),
  };
};

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
      const allEquipments = equipments?.map((equipment) => equipment.vehicle);
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
    return data;
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return [];
  }
};

export const fetchAllEquipmentJUSTEXAMPLE = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.vehicles.findMany({
      include: {
        type_rel: true,
        brand_rel: true,
        model_rel: true,
      },
    });
    return data;
  } catch (error) {
    console.error('Error fetching employees:', error);
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
