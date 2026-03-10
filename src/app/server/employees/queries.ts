'use server';
import { prisma } from '@/lib/prisma';
import { storageServer } from '@/lib/storage-server';
import { supabaseServer } from '@/lib/supabase/server';
import { getActionContext } from '@/lib/server-action-context';
import { fetchCurrentUser, fetchCustomers, fetchProvinces } from '../company/queries';
import type { status_type } from '@/generated/prisma/client';

// Employee-related queries

export const fetchWorkDiagrams = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.work_diagram.findMany({
      where: { is_active: true },
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

export const fetchAllCategories = async () => {
  try {
    const data = await prisma.category.findMany({
      where: { is_active: true },
    });
    return data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

export const fetchHierrarchicalPositions = async () => {
  try {
    const data = await prisma.hierarchy.findMany({
      where: { is_active: true },
    });
    return data;
  } catch (error) {
    console.error('Error fetching hierarchical positions:', error);
    return [];
  }
};

export const setEmployeeDataOptions = async () => {
  const workDiagrams = await fetchWorkDiagrams();
  const guilds = await fetchGuilds();
  const covenants = await fetchCovenants();
  const categories = await fetchAllCategories();
  const hierarchicalPositions = await fetchHierrarchicalPositions();
  const customers = await fetchCustomers();
  const provinces = await fetchProvinces();

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
    type_of_contract: ['Período de prueba', 'A tiempo indeterminado', 'Plazo fijo'],
  };
};

export const fetchAllEmployeesWithRelations = async () => {
  const { companyId } = await getActionContext();
  const user = await fetchCurrentUser();
  if (!companyId) return [];

  // Update user metadata via supabase auth admin
  const supabase = await supabaseServer();
  supabase.auth.admin.updateUserById(user?.id || '', {
    app_metadata: {
      company: companyId,
    },
  });

  try {
    const data = await prisma.employees.findMany({
      where: { company_id: companyId },
      include: {
        guild_rel: true,
        covenants_rel: true,
        category_rel: true,
        city_rel: true,
        province_rel: true,
        workflow_diagram_rel: true,
        hierarchy_rel: true,
        birthplace_rel: true,
        contractor_employee: {
          include: { contractor: true },
        },
      },
      orderBy: { lastname: 'asc' },
    });
    return (data ?? []);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
};

export const fetchAllEmployeesWithRelationsById = async (id: string) => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.employees.findMany({
      where: { company_id: companyId, id },
      include: {
        guild_rel: true,
        covenants_rel: true,
        category_rel: true,
        city_rel: true,
        province_rel: true,
        workflow_diagram_rel: true,
        hierarchy_rel: true,
        birthplace_rel: true,
        contractor_employee: {
          include: { contractor: true },
        },
      },
    });
    return (data ?? []);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
};

export const findEmployeeByFullName = async (fullName: string) => {
  try {
    const { companyId } = await getActionContext();

    const employees = await prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT * FROM find_employee_by_full_name_v2(${fullName}, ${companyId || ''})
    `;

    return employees?.[0] || null;
  } catch (error) {
    console.error('Error al buscar empleado por nombre completo:', error);
    return null;
  }
};

export const fetchSingEmployee = async (employeesId: string) => {
  //Traer el tipo de documento que se llame firma
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const docType = await prisma.document_types.findFirst({
      where: { name: 'Firma', is_active: true },
      select: { id: true },
    });

    const employeeSingDocument = await prisma.documents_employees.findMany({
      where: {
        id_document_types: docType?.id || '',
        applies: employeesId,
        document_path: { not: null },
        is_active: true,
      },
    });

    const publicUrl = await storageServer.getPublicUrl('document_files', employeeSingDocument?.[0]?.document_path || '');


    return publicUrl || null;
  } catch (error) {
    console.error('Error fetching document type:', error);
    return null;
  }
};

export const fetchAllEmployees = async (role?: string) => {
  const { companyId } = await getActionContext();
  const user = await fetchCurrentUser();
  if (!companyId) return [];

  if (role === 'Invitado') {
    try {
      const data = await prisma.share_company_users.findMany({
        where: { profile_id: user?.id || '', company_id: companyId },
        include: {
          customer: {
            include: {
              contractor_equipment: {
                include: { vehicle: true },
              },
            },
          },
        },
      });

      const employees_raw = data?.[0]?.customer?.contractor_equipment;
      const allEmployees = employees_raw?.map((item) => item.vehicle);
      return allEmployees || [];
    } catch (error) {
      console.error('Error fetching employees:', error);
      return [];
    }
  }

  try {
    const data = await prisma.employees.findMany({
      where: { company_id: companyId },
    });
    return data;
  } catch (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
};

export const fetchAllActivesEmployees = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.employees.findMany({
      where: { company_id: companyId, is_active: true },
    });
    return data;
  } catch (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
};

export const fetchAllEmployeesJUSTEXAMPLE = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.employees.findMany();
    return data;
  } catch (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
};

export const getDiagramEmployee = async ({ employee_id }: { employee_id: string }) => {
  try {
    const data = await prisma.employees_diagram.findMany({
      where: { employee_id },
    });
    return data || [];
  } catch (error) {
    console.error('Error fetching document types:', error);
    return [];
  }
};

export const fetchDiagramsHistoryByEmployeeId = async (employeeId: string) => {
  try {
    const data = await prisma.diagrams_logs.findMany({
      where: { employee_id: employeeId },
      include: { modified_by_profile: true },
      orderBy: { created_at: 'desc' },
    });
    return data;
  } catch (error) {
    console.error('Error fetching diagrams history:', error);
    return [];
  }
};

export const fetchDiagrams = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.employees_diagram.findMany({
      where: {
        employee: { company_id: companyId },
      },
      include: {
        diagram_type_rel: true,
        employee: true,
      },
    });
    return data;
  } catch (error) {
    console.error('Error fetching diagrams:', error);
    return [];
  }
};

export const fetchDiagramsByEmployeeId = async (employeeId: string) => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.employees_diagram.findMany({
      where: {
        employee_id: employeeId,
      },
      include: {
        diagram_type_rel: true,
        employee: true,
      },
    });
    return data;
  } catch (error) {
    console.error('Error fetching diagrams:', error);
    return [];
  }
};

export const fetchDiagramsTypes = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.diagram_type.findMany({
      where: { company_id: companyId },
    });
    return data;
  } catch (error) {
    console.error('Error fetching diagrams types:', error);
    return [];
  }
};

export const fetchEmployeesWithDocs = async (companyId: string) => {
  if (!companyId) return [];
  try {
    const data = await prisma.employees.findMany({
      where: { company_id: companyId },
      include: {
        city_rel: { select: { name: true } },
        province_rel: { select: { name: true } },
        workflow_diagram_rel: { select: { name: true } },
        hierarchy_rel: { select: { name: true } },
        birthplace_rel: { select: { name: true } },
        documents_employees: { include: { document_type: true } },
        guild_rel: true,
        covenants_rel: true,
        category_rel: true,
        contractor_employee: { include: { contractor: true } },
      },
    });
    return (data ?? []);
  } catch (error) {
    console.error('Error fetching employees with docs:', error);
    return [];
  }
};

export const fetchEmployeesByCompanyAndStatus = async (companyId: string, status: string) => {
  if (!companyId) return [];
  try {
    const data = await prisma.employees.findMany({
      where: { company_id: companyId, status: status as status_type },
      include: {
        city_rel: { select: { name: true } },
        province_rel: { select: { name: true } },
        workflow_diagram_rel: { select: { name: true } },
        hierarchy_rel: { select: { name: true } },
        birthplace_rel: { select: { name: true } },
        contractor_employee: { include: { contractor: true } },
      },
    });
    return (data ?? []);
  } catch (error) {
    console.error('Error fetching employees by status:', error);
    return [];
  }
};

export const fetchHierarchy = async () => {
  try {
    const data = await prisma.hierarchy.findMany();
    return data ?? [];
  } catch (error) {
    console.error('Error fetching hierarchy:', error);
    return [];
  }
};

export const fetchAllWorkDiagrams = async () => {
  try {
    const data = await prisma.work_diagram.findMany();
    return data ?? [];
  } catch (error) {
    console.error('Error fetching work diagrams:', error);
    return [];
  }
};

export const fetchAllCustomers = async () => {
  try {
    const data = await prisma.customers.findMany();
    return data ?? [];
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
};
