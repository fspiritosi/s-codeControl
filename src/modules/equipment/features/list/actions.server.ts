'use server';
import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { getSession } from '@/shared/lib/session';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable/types';
import {
  parseSearchParams,
  stateToPrismaParams,
  buildSearchWhere,
  buildFiltersWhere,
  buildTextFiltersWhere,
} from '@/shared/components/common/DataTable/helpers';

// Vehicle/Equipment-related queries

export const fetchAllEquipmentWithRelations = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.vehicles.findMany({
      where: { company_id: companyId, is_active: true },
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

  const session = await getSession();
  const role = session.role;
  const userId = session.user?.id;

  if (role === 'Invitado') {
    try {
      const data = await prisma.share_company_users.findMany({
        where: {
          profile_id: userId || '',
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
      where: { company_id: (companyId ?? company_equipment_id) || '', is_active: true },
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

// ============================================================================
// PAGINATED EQUIPMENT (New DataTable)
// ============================================================================

/** Shared include clause for paginated / export queries */
const equipmentPaginatedInclude = {
  brand_rel: { select: { name: true } },
  model_rel: { select: { name: true } },
  type_rel: { select: { name: true } },
  type_of_vehicle_rel: { select: { name: true } },
  contractor_equipment: { include: { contractor: true } },
};

/** Column map: front-end filter key → Prisma field (faceted / exact match) */
const equipmentColumnMap: Record<string, string> = {
  status: 'status',
  condition: 'condition',
  type: 'type',
  types_of_vehicles: 'type_of_vehicle',
};

/** Text-based filter columns (contains insensitive) sobre campos string directos */
const equipmentTextFilterColumns = ['domain', 'intern_number', 'chassis', 'engine', 'serie', 'year'];

/** Text filters sobre FK relations */
const equipmentFkTextFilters: Record<string, { relation: string; field: string }> = {
  brand: { relation: 'brand_rel', field: 'name' },
  model: { relation: 'model_rel', field: 'name' },
};

/** Search fields for global search */
const equipmentSearchFields = ['domain', 'intern_number', 'chassis', 'engine', 'serie'];

type EquipmentPaginatedOptions = { showInactive?: boolean };

/**
 * Build the combined `where` clause for equipment, shared between paginated and export queries.
 */
function buildEquipmentWhere(
  state: ReturnType<typeof parseSearchParams>,
  companyId: string,
  showInactive?: boolean,
) {
  // 1. Base where
  const baseWhere: Record<string, unknown> = {
    company_id: companyId,
    is_active: showInactive ? false : true,
  };

  // 2. Global search (OR across multiple text fields)
  const searchWhere = state.search
    ? buildSearchWhere(state.search, equipmentSearchFields)
    : {};

  // 3. Faceted / discrete filters (enums + FK UUIDs)
  const filtersWhere = buildFiltersWhere(state.filters, equipmentColumnMap);

  // 4. Convert BigInt FK filters: type_of_vehicle comes as string from URL
  const bigIntFields = ['type_of_vehicle'] as const;
  for (const field of bigIntFields) {
    if (filtersWhere[field]) {
      const raw = filtersWhere[field];
      if (typeof raw === 'string') {
        try { filtersWhere[field] = BigInt(raw); } catch { /* keep as-is */ }
      } else if (typeof raw === 'object' && raw !== null && 'in' in raw) {
        const arr = (raw as { in: string[] }).in;
        filtersWhere[field] = {
          in: arr.map((v) => { try { return BigInt(v); } catch { return v; } }),
        };
      }
    }
  }

  // 5. Text-based filters (contains insensitive) sobre campos string directos
  const textFiltersWhere = buildTextFiltersWhere(state.filters, equipmentTextFilterColumns);

  // 6. Text filters sobre FK relations (brand, model)
  const fkTextFiltersWhere: Record<string, unknown> = {};
  for (const [columnId, config] of Object.entries(equipmentFkTextFilters)) {
    const values = state.filters[columnId];
    const firstValue = values?.[0];
    if (firstValue) {
      fkTextFiltersWhere[config.relation] = {
        is: { [config.field]: { contains: firstValue, mode: 'insensitive' } },
      };
    }
  }

  return {
    ...baseWhere,
    ...searchWhere,
    ...filtersWhere,
    ...textFiltersWhere,
    ...fkTextFiltersWhere,
  };
}

/**
 * Paginated equipment query for the new DataTable.
 * Returns `{ data, total }` where data is the current page and total is the full count.
 */
export async function getEquipmentPaginated(
  searchParams: DataTableSearchParams,
  options?: EquipmentPaginatedOptions,
) {
  const { companyId } = await getActionContext();
  if (!companyId) return { data: [], total: 0 };

  try {
    const state = parseSearchParams(searchParams);
    const { skip, take, orderBy } = stateToPrismaParams(state);

    const where = buildEquipmentWhere(state, companyId, options?.showInactive);

    const [data, total] = await Promise.all([
      prisma.vehicles.findMany({
        where,
        include: equipmentPaginatedInclude,
        skip,
        take,
        orderBy: orderBy ?? { domain: 'asc' },
      }),
      prisma.vehicles.count({ where }),
    ]);

    return { data, total };
  } catch (error) {
    console.error('Error in getEquipmentPaginated:', error);
    return { data: [], total: 0 };
  }
}

/**
 * Facet counts for equipment filter options.
 * Returns a record keyed by field name, each containing an array of { value, count }.
 */
export async function getEquipmentFacets(
  showInactive?: boolean,
): Promise<Record<string, { value: string; count: number }[]>> {
  const { companyId } = await getActionContext();
  if (!companyId) return {};

  try {
    const baseWhere = {
      company_id: companyId,
      is_active: showInactive ? false : true,
    };

    // Helper to group by a single field — no null filter in where (fails on enum fields)
    const groupByField = async (field: string) => {
      const result = await (prisma.vehicles.groupBy as any)({
        by: [field],
        where: baseWhere,
        _count: { _all: true },
      });
      return result;
    };

    const [statusCounts, conditionCounts] = await Promise.all([
      groupByField('status'),
      groupByField('condition'),
    ]);

    // Helper to convert groupBy result to facet array
    const toFacetArray = (counts: any[], field: string) =>
      counts
        .filter((item) => item[field] != null && item[field] !== '')
        .map((item) => ({
          value: String(item[field]),
          count: item._count?._all ?? item._count ?? 0,
        }));

    return {
      status: toFacetArray(statusCounts, 'status'),
      condition: toFacetArray(conditionCounts, 'condition'),
    };
  } catch (error) {
    console.error('Error in getEquipmentFacets:', error);
    return {};
  }
}

/**
 * Same query as getEquipmentPaginated but WITHOUT pagination (skip/take).
 * Used for Excel export with current filters applied.
 */
export async function getAllEquipmentForExport(
  searchParams: DataTableSearchParams,
  options?: EquipmentPaginatedOptions,
) {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const state = parseSearchParams(searchParams);
    const where = buildEquipmentWhere(state, companyId, options?.showInactive);

    // Use orderBy from state if provided, otherwise default
    const orderBy = state.sortBy
      ? { [state.sortBy]: state.sortOrder }
      : { domain: 'asc' as const };

    const data = await prisma.vehicles.findMany({
      where,
      include: equipmentPaginatedInclude,
      orderBy,
    });

    return data;
  } catch (error) {
    console.error('Error in getAllEquipmentForExport:', error);
    return [];
  }
}

/**
 * Fetch lean de equipos activos para el picker de /maintenance.
 * Solo devuelve id, domain y serie — lo mínimo para listar y navegar.
 */
export async function fetchActiveEquipmentForPicker(companyId: string) {
  if (!companyId) return [];

  try {
    const data = await prisma.vehicles.findMany({
      where: { company_id: companyId, is_active: true },
      select: { id: true, domain: true, serie: true, intern_number: true },
      orderBy: { domain: 'asc' },
    });
    return data;
  } catch (error) {
    console.error('Error in fetchActiveEquipmentForPicker:', error);
    return [];
  }
}

/**
 * Devuelve el primer companyId asociado a un profile.
 * Prioriza empresas donde es owner, luego empresas compartidas.
 * Usado por /maintenance picker cuando el login es por Invitado.
 */
export async function getFirstCompanyIdForProfile(profileId: string): Promise<string | null> {
  if (!profileId) return null;

  try {
    const owned = await prisma.company.findFirst({
      where: { owner_id: profileId, is_active: true },
      select: { id: true },
    });
    if (owned) return owned.id;

    const shared = await prisma.share_company_users.findFirst({
      where: { profile_id: profileId },
      select: { company_id: true },
    });
    return shared?.company_id ?? null;
  } catch (error) {
    console.error('Error in getFirstCompanyIdForProfile:', error);
    return null;
  }
}
