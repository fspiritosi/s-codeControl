'use server';
import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { fetchCustomers } from '@/modules/company/features/customers/actions.server';

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
