'use server';
import { prisma } from '@/shared/lib/prisma';
import { supabaseServer } from '@/shared/lib/supabase/server';
import { getActionContext } from '@/shared/lib/server-action-context';
import { fetchCurrentUser } from '@/shared/actions/auth';
import type { status_type } from '@/generated/prisma/client';

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

export const fetchEmployeesForInitStore = async (companyId: string, active: boolean) => {
  try {
    const data = await prisma.employees.findMany({
      where: { company_id: companyId, is_active: active },
      include: {
        city_rel: { select: { name: true } },
        province_rel: { select: { name: true } },
        workflow_diagram_rel: { select: { name: true } },
        hierarchy_rel: { select: { name: true } },
        birthplace_rel: { select: { name: true } },
        contractor_employee: { include: { contractor: true } },
      },
    });
    return data ?? [];
  } catch (error) {
    console.error('Error fetching employees for init store:', error);
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

// RPC filter replacements (replacing supabase.rpc calls)

export const filterEmployeesByConditions = async (companyId: string, filters: { property: string; values: string[] }[]) => {
  try {
    // Build dynamic where conditions
    let where: any = { company_id: companyId };
    for (const filter of filters) {
      where[filter.property] = { in: filter.values };
    }
    const data = await prisma.employees.findMany({ where });
    return data ?? [];
  } catch (error) {
    console.error('Error filtering employees:', error);
    return [];
  }
};

export const filterVehiclesByConditions = async (companyId: string, filters: { property: string; values: string[] }[]) => {
  try {
    let where: any = { company_id: companyId };
    for (const filter of filters) {
      where[filter.property] = { in: filter.values };
    }
    const data = await prisma.vehicles.findMany({ where });
    return data ?? [];
  } catch (error) {
    console.error('Error filtering vehicles:', error);
    return [];
  }
};
