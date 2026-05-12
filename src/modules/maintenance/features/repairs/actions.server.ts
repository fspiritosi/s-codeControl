'use server';
import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable/types';
import {
  parseSearchParams,
  stateToPrismaParams,
  buildFiltersWhere,
  buildTextFiltersWhere,
} from '@/shared/components/common/DataTable/helpers';

// Repair-related queries

export const fetchAllOpenRepairRequests = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.repair_solicitudes.findMany({
      where: {
        equipment: { company_id: companyId },
        state: { in: ['Pendiente', 'Esperando_repuestos', 'En_reparacion'] },
      },
      include: {
        user: true,
        employee: true,
        equipment: {
          include: {
            type_rel: true,
            brand_rel: true,
            model_rel: true,
          },
        },
        reparation_type_rel: true,
        repairlogs: {
          include: {
            employee: true,
            user: true,
          },
        },
      },
    });
    return data as any[];
  } catch (error) {
    console.error('Error fetching open repair requests:', error);
    return [];
  }
};

export const fetchRepairRequestsByEquipmentId = async (equipmentId: string) => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.repair_solicitudes.findMany({
      where: {
        equipment_id: equipmentId,
        state: { in: ['Pendiente', 'Esperando_repuestos', 'En_reparacion'] },
      },
      include: {
        user: true,
        employee: true,
        equipment: {
          include: {
            type_rel: true,
            brand_rel: true,
            model_rel: true,
          },
        },
        reparation_type_rel: true,
        repairlogs: {
          include: {
            employee: true,
            user: true,
          },
        },
      },
    });
    return data as any[];
  } catch (error) {
    console.error('Error fetching repair requests by equipment ID:', error);
    return [];
  }
};

// Repair mutations

export const fetchOpenRepairsByEquipmentIdsAndType = async (
  equipmentIds: string[],
  reparationTypeId: string
) => {
  try {
    const data = await prisma.repair_solicitudes.findMany({
      where: {
        equipment_id: { in: equipmentIds },
        reparation_type: reparationTypeId,
        state: { notIn: ['Cancelado', 'Finalizado', 'Rechazado'] },
      },
      include: { equipment: true },
    });
    return data;
  } catch (error) {
    console.error('Error fetching open repairs by equipment ids:', error);
    return [];
  }
};

export const fetchOpenRepairsByEquipmentAndType = async (
  equipmentId: string,
  reparationTypeId: string
) => {
  try {
    const data = await prisma.repair_solicitudes.findMany({
      where: {
        equipment_id: equipmentId,
        reparation_type: reparationTypeId,
        state: { notIn: ['Cancelado', 'Finalizado', 'Rechazado'] },
      },
    });
    return data;
  } catch (error) {
    console.error('Error fetching open repairs:', error);
    return [];
  }
};

export const fetchRepairSolicitudesByEquipment = async (equipmentId: string) => {
  try {
    const data = await prisma.repair_solicitudes.findMany({
      where: { equipment_id: equipmentId },
      include: {
        reparation_type_rel: true,
        user: true,
        employee: true,
      },
    });
    return data;
  } catch (error) {
    console.error('Error fetching repair solicitudes by equipment:', error);
    return [];
  }
};

export const updateRepairSolicitude = async (
  id: string,
  updateData: Record<string, unknown>
) => {
  try {
    const data = await prisma.repair_solicitudes.update({
      where: { id },
      data: updateData as any,
    });

    // Si cambió el state, recalcular la condición del vehículo
    if (updateData.state && data.equipment_id) {
      await recalculateVehicleCondition(data.equipment_id);
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error updating repair solicitude:', error);
    return { data: null, error: String(error) };
  }
};

const OPEN_STATES = ['Pendiente', 'Esperando_repuestos', 'En_reparacion'] as const;

/**
 * Recalcula la condición del vehículo en función de sus solicitudes de reparación abiertas.
 * - Si hay alguna abierta con criticidad Alta → 'no operativo'
 * - Sino si hay alguna abierta con criticidad Media → 'operativo condicionado'
 * - Sino → 'operativo'
 *
 * Respeta el estado 'en reparación' (no lo pisa) para no interferir con el flujo del mecánico.
 */
// ============================================================
// PAGINATED LIST (Fase B - server-side DataTable)
// ============================================================

const MECHANIC_OPEN_STATES = ['Pendiente', 'Esperando_repuestos', 'En_reparacion', 'Programado'] as const;

const repairSolicitudesColumnMap: Record<string, string> = {
  state: 'state',
};

const repairSolicitudesSortMap: Record<string, Record<string, unknown>> = {
  title: { reparation_type_rel: { name: 'placeholder' } },
  priority: { reparation_type_rel: { criticity: 'placeholder' } },
  domain: { equipment: { domain: 'placeholder' } },
  intern_number: { equipment: { intern_number: 'placeholder' } },
};

function buildRepairSortOrderBy(
  orderBy: Record<string, 'asc' | 'desc'> | undefined
): Record<string, unknown> | undefined {
  if (!orderBy) return undefined;
  const [col, dir] = Object.entries(orderBy)[0];
  const mapped = repairSolicitudesSortMap[col];
  if (!mapped) return orderBy;
  const replace = (obj: Record<string, unknown>): Record<string, unknown> => {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      result[k] = v === 'placeholder' ? dir : replace(v as Record<string, unknown>);
    }
    return result;
  };
  return replace(mapped);
}

const repairSolicitudesTextColumns = ['user_description'];

type GetRepairSolicitudesOptions = {
  mechanic?: boolean;
  defaultEquipmentId?: string;
};

function buildRepairSolicitudesWhere(
  state: ReturnType<typeof parseSearchParams>,
  companyId: string,
  options: GetRepairSolicitudesOptions = {}
) {
  const where: Record<string, unknown> = {
    equipment: { company_id: companyId },
  };

  if (options.defaultEquipmentId) {
    where.equipment_id = options.defaultEquipmentId;
  }

  const allowedStates = options.mechanic ? [...MECHANIC_OPEN_STATES] : null;
  const stateFilter = state.filters.state;
  if (stateFilter?.length) {
    const requested = allowedStates
      ? stateFilter.filter((v) => (allowedStates as string[]).includes(v))
      : stateFilter;
    if (requested.length > 0) {
      where.state = requested.length === 1 ? requested[0] : { in: requested };
    } else if (allowedStates) {
      where.state = { in: allowedStates };
    }
  } else if (allowedStates) {
    where.state = { in: allowedStates };
  }

  const scalarFilters = buildFiltersWhere(state.filters, repairSolicitudesColumnMap, {
    exclude: ['title', 'priority', 'domain', 'intern_number', 'state'],
  });
  Object.assign(where, scalarFilters);

  // Relational filters
  const titleValues = state.filters.title;
  const priorityValues = state.filters.priority;
  if (titleValues?.length || priorityValues?.length) {
    const repTypeWhere: Record<string, unknown> = {};
    if (titleValues?.length) {
      repTypeWhere.name = titleValues.length === 1 ? titleValues[0] : { in: titleValues };
    }
    if (priorityValues?.length) {
      repTypeWhere.criticity =
        priorityValues.length === 1 ? priorityValues[0] : { in: priorityValues };
    }
    where.reparation_type_rel = repTypeWhere;
  }

  const domainValues = state.filters.domain;
  const internValues = state.filters.intern_number;
  if (domainValues?.length || internValues?.length) {
    const equipmentFilter = (where.equipment as Record<string, unknown>) || {};
    if (domainValues?.length) {
      equipmentFilter.domain =
        domainValues.length === 1 ? domainValues[0] : { in: domainValues };
    }
    if (internValues?.length) {
      equipmentFilter.intern_number =
        internValues.length === 1 ? internValues[0] : { in: internValues };
    }
    where.equipment = equipmentFilter;
  }

  const textWhere = buildTextFiltersWhere(state.filters, repairSolicitudesTextColumns);
  Object.assign(where, textWhere);

  return where;
}

const REPAIR_SOLICITUD_LIST_SELECT = {
  id: true,
  created_at: true,
  state: true,
  user_description: true,
  mechanic_description: true,
  user_images: true,
  mechanic_images: true,
  kilometer: true,
  reparation_type_rel: {
    select: { name: true, criticity: true, type_of_maintenance: true },
  },
  equipment: {
    select: {
      id: true,
      domain: true,
      serie: true,
      intern_number: true,
      year: true,
      engine: true,
      chassis: true,
      status: true,
      condition: true,
      picture: true,
      brand_rel: { select: { name: true } },
      model_rel: { select: { name: true } },
      type_rel: { select: { name: true } },
    },
  },
} as const;

type RepairListRow = {
  id: string;
  created_at: Date;
  state: string;
  user_description: string | null;
  mechanic_description: string | null;
  user_images: string[];
  mechanic_images: string[];
  kilometer: string | null;
  reparation_type_rel: { name: string; criticity: string; type_of_maintenance: string } | null;
  equipment: {
    id: string;
    domain: string | null;
    serie: string | null;
    intern_number: string | null;
    year: string | null;
    engine: string | null;
    chassis: string | null;
    status: string | null;
    condition: string | null;
    picture: string | null;
    brand_rel: { name: string } | null;
    model_rel: { name: string } | null;
    type_rel: { name: string } | null;
  } | null;
};

function formatRepairRow(rs: RepairListRow) {
  const eq = rs.equipment;
  return {
    id: rs.id,
    title: rs.reparation_type_rel?.name ?? '',
    state: rs.state,
    priority: rs.reparation_type_rel?.criticity ?? '',
    type_of_maintenance: rs.reparation_type_rel?.type_of_maintenance ?? '',
    created_at: rs.created_at,
    user_description: rs.user_description ?? '',
    description: rs.user_description ?? '',
    mechanic_description: rs.mechanic_description ?? '',
    user_images: rs.user_images ?? [],
    mechanic_images: rs.mechanic_images ?? [],
    kilometer: rs.kilometer,
    solicitud_status: rs.state,
    equipment: eq ? `${eq.domain ?? ''} - ${eq.intern_number ?? ''}` : '',
    domain: eq?.domain ?? eq?.serie ?? '',
    serie: eq?.serie ?? '',
    intern_number: eq?.intern_number ?? '',
    year: eq?.year ?? '',
    engine: eq?.engine ?? '',
    chassis: eq?.chassis ?? '',
    status: eq?.status ?? '',
    vehicle_condition: eq?.condition ?? '',
    picture: eq?.picture ?? '',
    brand: eq?.brand_rel?.name ?? '',
    model: eq?.model_rel?.name ?? '',
    type_of_equipment: eq?.type_rel?.name ?? '',
    vehicle_id: eq?.id ?? '',
  };
}

export async function getRepairSolicitudesPaginated(
  searchParams: DataTableSearchParams,
  options: GetRepairSolicitudesOptions = {}
) {
  const { companyId } = await getActionContext();
  if (!companyId) return { data: [], total: 0 };

  try {
    const state = parseSearchParams(searchParams);
    const { skip, take, orderBy } = stateToPrismaParams(state);
    const where = buildRepairSolicitudesWhere(state, companyId, options);

    const [dataRaw, total] = await Promise.all([
      prisma.repair_solicitudes.findMany({
        where,
        skip,
        take,
        orderBy: buildRepairSortOrderBy(orderBy) ?? { created_at: 'desc' },
        select: REPAIR_SOLICITUD_LIST_SELECT,
      }),
      prisma.repair_solicitudes.count({ where }),
    ]);

    return { data: (dataRaw as RepairListRow[]).map(formatRepairRow), total };
  } catch (error) {
    console.error('Error fetching repair solicitudes paginated:', error);
    return { data: [], total: 0 };
  }
}

export async function getRepairSolicitudFacets(options: GetRepairSolicitudesOptions = {}) {
  const { companyId } = await getActionContext();
  if (!companyId) return {};

  try {
    const baseWhere: Record<string, unknown> = { equipment: { company_id: companyId } };
    if (options.defaultEquipmentId) baseWhere.equipment_id = options.defaultEquipmentId;
    if (options.mechanic) baseWhere.state = { in: [...MECHANIC_OPEN_STATES] };

    const [stateGroups, solicitudes] = await Promise.all([
      prisma.repair_solicitudes.groupBy({
        by: ['state'],
        where: baseWhere,
        _count: true,
      }),
      prisma.repair_solicitudes.findMany({
        where: baseWhere,
        select: {
          reparation_type_rel: { select: { name: true, criticity: true } },
          equipment: { select: { domain: true, serie: true, intern_number: true } },
        },
      }),
    ]);

    const titleCount = new Map<string, number>();
    const priorityCount = new Map<string, number>();
    const domainCount = new Map<string, number>();
    const internCount = new Map<string, number>();

    for (const rs of solicitudes) {
      const t = rs.reparation_type_rel?.name;
      if (t) titleCount.set(t, (titleCount.get(t) ?? 0) + 1);
      const p = rs.reparation_type_rel?.criticity;
      if (p) priorityCount.set(p, (priorityCount.get(p) ?? 0) + 1);
      const d = rs.equipment?.domain ?? rs.equipment?.serie;
      if (d) domainCount.set(d, (domainCount.get(d) ?? 0) + 1);
      const i = rs.equipment?.intern_number;
      if (i) internCount.set(i, (internCount.get(i) ?? 0) + 1);
    }

    const toEntries = (m: Map<string, number>) =>
      Array.from(m.entries()).map(([value, count]) => ({ value, count }));

    return {
      state: stateGroups.map((g) => ({ value: g.state, count: g._count })),
      title: toEntries(titleCount),
      priority: toEntries(priorityCount),
      domain: toEntries(domainCount),
      intern_number: toEntries(internCount),
    };
  } catch (error) {
    console.error('Error fetching repair solicitud facets:', error);
    return {};
  }
}

export async function getAllRepairSolicitudesForExport(
  searchParams: DataTableSearchParams,
  options: GetRepairSolicitudesOptions = {}
) {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const state = parseSearchParams(searchParams);
    const where = buildRepairSolicitudesWhere(state, companyId, options);
    const dataRaw = await prisma.repair_solicitudes.findMany({
      where,
      orderBy: { created_at: 'desc' },
      select: REPAIR_SOLICITUD_LIST_SELECT,
    });
    return (dataRaw as RepairListRow[]).map(formatRepairRow);
  } catch (error) {
    console.error('Error exporting repair solicitudes:', error);
    return [];
  }
}

export async function fetchRepairLogsBySolicitudId(solicitudId: string) {
  try {
    const logs = await prisma.repairlogs.findMany({
      where: { repair_id: solicitudId },
      orderBy: { created_at: 'asc' },
      include: {
        user: { select: { fullname: true } },
        employee: { select: { firstname: true, lastname: true } },
      },
    });
    return logs.map((log) => ({
      id: log.id,
      title: log.title,
      description: log.description,
      kilometer: log.kilometer,
      created_at: log.created_at,
      modified_by_user: log.user,
      modified_by_employee: log.employee,
    }));
  } catch (error) {
    console.error('Error fetching repair logs by solicitud id:', error);
    return [];
  }
}

export const recalculateVehicleCondition = async (vehicleId: string) => {
  try {
    const openRepairs = await prisma.repair_solicitudes.findMany({
      where: {
        equipment_id: vehicleId,
        state: { in: OPEN_STATES as any },
      },
      include: { reparation_type_rel: { select: { criticity: true } } },
    });

    const hasHigh = openRepairs.some((r) => r.reparation_type_rel?.criticity === 'Alta');
    const hasMedium = openRepairs.some((r) => r.reparation_type_rel?.criticity === 'Media');

    const vehicle = await prisma.vehicles.findUnique({
      where: { id: vehicleId },
      select: { condition: true },
    });
    if (!vehicle) return;

    // No pisar 'en_reparacion' — ese estado lo maneja el mecánico
    if (vehicle.condition === 'en_reparacion') return;

    let newCondition: 'no_operativo' | 'operativo_condicionado' | 'operativo';
    if (hasHigh) newCondition = 'no_operativo';
    else if (hasMedium) newCondition = 'operativo_condicionado';
    else newCondition = 'operativo';

    if (newCondition === vehicle.condition) return;

    await prisma.vehicles.update({
      where: { id: vehicleId },
      data: { condition: newCondition },
    });
  } catch (error) {
    console.error('Error recalculating vehicle condition:', error);
  }
};
