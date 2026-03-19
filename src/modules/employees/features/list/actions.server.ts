'use server';
import { prisma } from '@/shared/lib/prisma';
import { supabaseServer } from '@/shared/lib/supabase/server';
import { getActionContext } from '@/shared/lib/server-action-context';
import { fetchCurrentUser } from '@/shared/actions/auth';
import type { status_type } from '@/generated/prisma/client';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable/types';
import {
  parseSearchParams,
  stateToPrismaParams,
  buildSearchWhere,
  buildFiltersWhere,
  buildTextFiltersWhere,
} from '@/shared/components/common/DataTable/helpers';

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

// ============================================================================
// PAGINATED / FACETS / EXPORT — New DataTable server-side actions
// ============================================================================

/**
 * Map from front-end column IDs (used in URL searchParams) to Prisma field paths.
 * Columns whose columnId already matches the Prisma field don't need an entry,
 * but we list them anyway for clarity.
 */
const employeeColumnMap: Record<string, string> = {
  // Direct scalar fields
  status: 'status',
  document_type: 'document_type',
  type_of_contract: 'type_of_contract',
  gender: 'gender',
  nationality: 'nationality',
  marital_status: 'marital_status',
  level_of_education: 'level_of_education',
  affiliate_status: 'affiliate_status',
  // Relation FK fields (front-end name → Prisma FK column)
  guild: 'guild_id',
  covenants: 'covenants_id',
  category: 'category_id',
  hierarchical_position: 'hierarchical_position',
  workflow_diagram: 'workflow_diagram',
};

/** Text-based filter columns that use `contains` instead of exact match */
const employeeTextFilterColumns = ['allocated_to', 'company_position'];

/** Shared include clause for paginated / export queries */
const employeePaginatedInclude = {
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
} as const;

/** Search fields for global search */
const employeeSearchFields = ['firstname', 'lastname', 'cuil', 'document_number', 'email'];

/**
 * Build the combined `where` clause for employees, shared between paginated and export queries.
 */
function buildEmployeesWhere(state: ReturnType<typeof parseSearchParams>, companyId: string) {
  // 1. Base where
  const baseWhere: Record<string, unknown> = { company_id: companyId };

  // Handle is_active filter: default active, allow 'false' or 'all'
  const isActiveFilter = state.filters.is_active;
  if (isActiveFilter?.includes('false')) {
    baseWhere.is_active = false;
  } else if (isActiveFilter?.includes('all')) {
    // No is_active constraint — show all
  } else {
    baseWhere.is_active = true;
  }

  // 2. Global search (OR across multiple text fields)
  const searchWhere = state.search
    ? buildSearchWhere(state.search, employeeSearchFields)
    : {};

  // 3. Faceted / discrete filters (enums, FK UUIDs)
  const filtersWhere = buildFiltersWhere(state.filters, employeeColumnMap, {
    exclude: [...employeeTextFilterColumns, 'is_active', 'province', 'city', 'birthplace'],
  });

  // 4. Text-based filters (contains insensitive)
  const textFiltersWhere = buildTextFiltersWhere(state.filters, employeeTextFilterColumns);

  // 5. BigInt FK filters: province, city (come as strings from URL, need BigInt conversion)
  const provinceBigInts = state.filters.province?.map((v) => {
    try { return BigInt(v); } catch { return null; }
  }).filter((v): v is bigint => v !== null);
  if (provinceBigInts?.length) {
    filtersWhere.province = provinceBigInts.length === 1 ? provinceBigInts[0] : { in: provinceBigInts };
  }

  const cityBigInts = state.filters.city?.map((v) => {
    try { return BigInt(v); } catch { return null; }
  }).filter((v): v is bigint => v !== null);
  if (cityBigInts?.length) {
    filtersWhere.city = cityBigInts.length === 1 ? cityBigInts[0] : { in: cityBigInts };
  }

  // 6. UUID FK filter: birthplace
  const birthplaceValues = state.filters.birthplace;
  if (birthplaceValues?.length) {
    filtersWhere.birthplace = birthplaceValues.length === 1 ? birthplaceValues[0] : { in: birthplaceValues };
  }

  return {
    ...baseWhere,
    ...searchWhere,
    ...filtersWhere,
    ...textFiltersWhere,
  };
}

/**
 * Paginated employees query for the new DataTable.
 * Returns `{ data, total }` where data is the current page and total is the full count.
 */
export async function getEmployeesPaginated(searchParams: DataTableSearchParams) {
  const { companyId } = await getActionContext();
  if (!companyId) return { data: [], total: 0 };

  try {
    const state = parseSearchParams(searchParams);
    const { skip, take, orderBy } = stateToPrismaParams(state);

    const where = buildEmployeesWhere(state, companyId);

    const [data, total] = await Promise.all([
      prisma.employees.findMany({
        where,
        include: employeePaginatedInclude,
        skip,
        take,
        orderBy: orderBy ?? { lastname: 'asc' },
      }),
      prisma.employees.count({ where }),
    ]);

    return { data, total };
  } catch (error) {
    console.error('Error in getEmployeesPaginated:', error);
    return { data: [], total: 0 };
  }
}

/**
 * Facet counts for employee filter options.
 * Returns a record keyed by field name, each containing an array of { value, count }.
 */
export async function getEmployeeFacets(): Promise<Record<string, { value: string; count: number }[]>> {
  const { companyId } = await getActionContext();
  if (!companyId) return {};

  try {
    const baseWhere = { company_id: companyId, is_active: true };

    const [
      statusCounts,
      typeOfContractCounts,
      documentTypeCounts,
      genderCounts,
      nationalityCounts,
    ] = await Promise.all([
      prisma.employees.groupBy({ by: ['status'], where: baseWhere, _count: true }),
      prisma.employees.groupBy({ by: ['type_of_contract'], where: baseWhere, _count: true }),
      prisma.employees.groupBy({ by: ['document_type'], where: baseWhere, _count: true }),
      prisma.employees.groupBy({ by: ['gender'], where: baseWhere, _count: true }),
      prisma.employees.groupBy({ by: ['nationality'], where: baseWhere, _count: true }),
    ]);

    // For hierarchical_position (UUID FK), get distinct values with counts and resolve names
    const hierarchyCounts = await prisma.employees.groupBy({
      by: ['hierarchical_position'],
      where: { ...baseWhere, hierarchical_position: { not: null } },
      _count: true,
    });

    const hierarchyIds = hierarchyCounts
      .map((r) => r.hierarchical_position)
      .filter((id): id is string => id !== null);

    const hierarchyRecords = hierarchyIds.length > 0
      ? await prisma.hierarchy.findMany({
          where: { id: { in: hierarchyIds } },
          select: { id: true, name: true },
        })
      : [];

    const hierarchyNameMap = new Map(hierarchyRecords.map((h) => [h.id, h.name]));

    // Build result
    const toFacetArray = <T>(
      counts: { _count: number }[],
      getValue: (item: T) => string | null | undefined,
    ) =>
      (counts as unknown as T[])
        .filter((item) => getValue(item) != null)
        .map((item) => ({
          value: String(getValue(item)),
          count: (item as unknown as { _count: number })._count,
        }));

    return {
      status: toFacetArray(statusCounts, (r: (typeof statusCounts)[number]) => r.status),
      type_of_contract: toFacetArray(typeOfContractCounts, (r: (typeof typeOfContractCounts)[number]) => r.type_of_contract),
      document_type: toFacetArray(documentTypeCounts, (r: (typeof documentTypeCounts)[number]) => r.document_type),
      gender: toFacetArray(genderCounts, (r: (typeof genderCounts)[number]) => r.gender),
      nationality: toFacetArray(nationalityCounts, (r: (typeof nationalityCounts)[number]) => r.nationality),
      hierarchical_position: hierarchyCounts
        .filter((r) => r.hierarchical_position !== null)
        .map((r) => ({
          value: r.hierarchical_position!,
          count: r._count,
          label: hierarchyNameMap.get(r.hierarchical_position!) ?? r.hierarchical_position!,
        })),
    };
  } catch (error) {
    console.error('Error in getEmployeeFacets:', error);
    return {};
  }
}

/**
 * Same query as getEmployeesPaginated but WITHOUT pagination (skip/take).
 * Used for Excel export with current filters applied.
 */
export async function getAllEmployeesForExport(searchParams: DataTableSearchParams) {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const state = parseSearchParams(searchParams);
    const where = buildEmployeesWhere(state, companyId);

    // Use orderBy from state if provided, otherwise default
    const orderBy = state.sortBy
      ? { [state.sortBy]: state.sortOrder }
      : { lastname: 'asc' as const };

    const data = await prisma.employees.findMany({
      where,
      include: employeePaginatedInclude,
      orderBy,
    });

    return data;
  } catch (error) {
    console.error('Error in getAllEmployeesForExport:', error);
    return [];
  }
}
