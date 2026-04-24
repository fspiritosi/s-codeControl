'use server';
import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { fetchCustomers } from '@/modules/company/features/customers/actions.server';
import { fetchProvinces } from '@/shared/actions/geography';
import { fetchAllCategories as _fetchAllCategories } from '@/shared/actions/catalogs';

export const fetchWorkDiagrams = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.work_diagram.findMany({
      where: {
        is_active: true,
        OR: [{ company_id: companyId }, { company_id: null }],
      },
      select: { id: true, name: true },
    });
    return data;
  } catch (error) {
    console.error('Error fetching work diagrams:', error);
    return [];
  }
};

export const fetchGuilds = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.guild.findMany({
      where: { is_active: true, company_id: companyId },
    });
    return data;
  } catch (error) {
    console.error('Error fetching guilds:', error);
    return [];
  }
};

export const fetchCovenants = async () => {
  const { companyId } = await getActionContext();

  try {
    const data = await prisma.covenant.findMany({
      where: { is_active: true, company_id: companyId || '' },
    });
    return data;
  } catch (error) {
    console.error('Error fetching covenants:', error);
    return [];
  }
};

export const fetchHierrarchicalPositions = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.hierarchy.findMany({
      where: {
        is_active: true,
        OR: [{ company_id: companyId }, { company_id: null }],
      },
    });
    return data;
  } catch (error) {
    console.error('Error fetching hierarchical positions:', error);
    return [];
  }
};

export const fetchTypesOfContracts = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.types_of_contracts.findMany({
      where: {
        is_active: true,
        OR: [{ company_id: companyId }, { company_id: null }],
      },
      orderBy: { name: 'asc' },
    });
    return data;
  } catch (error) {
    console.error('Error fetching types of contracts:', error);
    return [];
  }
};

export const setEmployeeDataOptions = async () => {
  const [workDiagrams, guilds, covenants, categories, hierarchicalPositions, customers, provinces, typesOfContracts] =
    await Promise.all([
      fetchWorkDiagrams(),
      fetchGuilds(),
      fetchCovenants(),
      _fetchAllCategories(),
      fetchHierrarchicalPositions(),
      fetchCustomers(),
      fetchProvinces(),
      fetchTypesOfContracts(),
    ]);

  return {
    workflow_diagram: workDiagrams.map((diagram) => diagram.name),
    guild: guilds.map((guild) => guild.name!) || [],
    covenant: covenants.map((covenant) => covenant.name!),
    category: categories.map((category) => category.name!),
    hierarchical_position: hierarchicalPositions.map((position) => position.name),
    contractor_employee: customers.map((customer) => customer.name),
    province: provinces.map((province) => province.name.trim()),
    gender: ['Masculino', 'Femenino', 'No Declarado'],
    marital_status: ['Soltero', 'Casado', 'Viudo', 'Divorciado', 'Separado'],
    nationality: ['Argentina', 'Extranjero'],
    document_type: ['DNI', 'LE', 'LC', 'PASAPORTE'],
    level_of_education: ['Primario', 'Secundario', 'Terciario', 'Posgrado', 'Universitario'],
    status: ['Avalado', 'Completo', 'Incompleto', 'No avalado', 'Completo con doc vencida'],
    type_of_contract: typesOfContracts.map((t) => t.name),
  };
};
