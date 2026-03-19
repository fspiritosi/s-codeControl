'use server';
import { prisma } from '@/shared/lib/prisma';
import { supabaseServer } from '@/shared/lib/supabase/server';
import { getActionContext } from '@/shared/lib/server-action-context';
import { getActualRole, formatEmployeeDocuments } from '@/shared/lib/utils';
import { startOfDay, endOfDay, addMonths } from 'date-fns';
import type { Prisma } from '@/generated/prisma/client';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable/types';
import {
  parseSearchParams,
  stateToPrismaParams,
  buildSearchWhere,
  buildFiltersWhere,
} from '@/shared/components/common/DataTable/helpers';

// Document-related queries

export const fetchAllDocumentTypes = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.document_types.findMany({
      where: {
        is_active: true,
        OR: [{ company_id: companyId }, { company_id: null }],
      },
    });
    return data || [];
  } catch (error) {
    console.error('Error fetching document types:', error);
    return [];
  }
};

export const fetchDocumentsByDocumentTypeId = async (documentTypeId: string) => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.documents_employees.findMany({
      where: {
        id_document_types: documentTypeId,
        document_path: { not: null },
      },
    });
    return data;
  } catch (error) {
    console.error('Error fetching documents by document type:', error);
    return [];
  }
};

export const getNextMonthExpiringDocumentsEmployees = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const today = startOfDay(new Date());
  const nextMonth = endOfDay(addMonths(new Date(), 1));

  try {
    const data = await prisma.documents_employees.findMany({
      where: {
        employee: {
          is: { company_id: companyId, is_active: true },
        },
        document_type: {
          is: { is_active: true, NOT: { is_it_montlhy: true } },
        },
        validity: {
          not: null,
          lte: nextMonth.toISOString(),
        },
      },
      include: {
        document_type: true,
        employee: {
          include: {
            contractor_employee: {
              include: { contractor: true },
            },
          },
        },
      },
      orderBy: { validity: 'asc' },
    });

    // Filter documents with active document types and valid names
    return (
      (data)?.filter(
        (doc) =>
          doc.document_type?.is_active === true &&
          doc.document_type?.name &&
          doc.document_type?.name.trim() !== '' &&
          !doc.document_type?.name.startsWith('...') &&
          doc.employee?.is_active === true
      ) || []
    );
  } catch (error) {
    console.error('Error fetching next month expiring documents:', error);
    return [];
  }
};

export const getNextMonthExpiringDocumentsVehicles = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const today = startOfDay(new Date());
  const nextMonth = endOfDay(addMonths(new Date(), 1));

  try {
    const data = await prisma.documents_equipment.findMany({
      where: {
        vehicle: {
          is: { company_id: companyId, is_active: true },
        },
        document_type: {
          is: { is_active: true, NOT: { is_it_montlhy: true } },
        },
        validity: {
          not: null,
          lte: nextMonth.toISOString(),
        },
      },
      include: {
        document_type: true,
        vehicle: {
          include: {
            type_rel: true,
            brand_rel: true,
            model_rel: true,
          },
        },
      },
      orderBy: { validity: 'asc' },
    });

    // Filter documents with active document types and valid names
    return (
      (data)?.filter(
        (doc) =>
          doc.document_type?.is_active === true &&
          doc.document_type?.name &&
          doc.document_type?.name.trim() !== '' &&
          !doc.document_type?.name.startsWith('...') &&
          doc.vehicle?.is_active === true
      ) || []
    );
  } catch (error) {
    console.error('Error fetching next month expiring documents:', error);
    return [];
  }
};

export const getDocumentEmployeesById = async (id: string) => {
  try {
    const data = await prisma.documents_employees.findMany({
      where: { id },
      include: {
        document_type: true,
        employee: {
          include: {
            city_rel: { select: { name: true } },
            province_rel: { select: { name: true } },
            contractor_employee: {
              include: { contractor: true },
            },
            company: {
              include: { province_rel: { select: { name: true } } },
            },
          },
        },
      },
    });
    return data;
  } catch (error) {
    console.error('Error fetching document employees by id:', error);
    return [];
  }
};

export const getDocumentEquipmentById = async (id: string) => {
  try {
    const data = await prisma.documents_equipment.findMany({
      where: { id },
      include: {
        document_type: true,
        vehicle: {
          include: {
            brand_rel: { select: { name: true } },
            model_rel: { select: { name: true } },
            type_of_vehicle_rel: { select: { name: true } },
            company: {
              include: { province_rel: { select: { name: true } } },
            },
          },
        },
      },
    });
    return data;
  } catch (error) {
    console.error('Error fetching document equipment by id:', error);
    return [];
  }
};

export const fetchEmployeeMonthlyDocuments = async () => {
  const { companyId } = await getActionContext();

  if (!companyId) return [];

  try {
    const data = await prisma.documents_employees.findMany({
      where: {
        document_type: {
          is: { is_it_montlhy: true, is_active: true },
        },
        employee: {
          is: { company_id: companyId, is_active: true },
        },
      },
      include: {
        document_type: true,
        employee: {
          include: {
            contractor_employee: {
              include: { contractor: true },
            },
          },
        },
      },
    });
    return data;
  } catch (error) {
    console.error('Error fetching employee monthly documents:', error);
    return [];
  }
};

export const fetchEmployeeMonthlyDocumentsByEmployeeId = async (employeeId: string) => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = await getActualRole(companyId as string, user?.id as string);

  try {
    if (role === 'Invitado') {
      const data = await prisma.documents_employees.findMany({
        where: {
          applies: employeeId,
          document_type: {
            is: { is_it_montlhy: true, private: false, is_active: true },
          },
        },
        include: {
          document_type: true,
          employee: {
            include: {
              contractor_employee: {
                include: { contractor: true },
              },
            },
          },
        },
      });
      return data;
    } else {
      const data = await prisma.documents_employees.findMany({
        where: {
          applies: employeeId,
          document_type: {
            is: { is_it_montlhy: true, is_active: true },
          },
        },
        include: {
          document_type: true,
          employee: {
            include: {
              contractor_employee: {
                include: { contractor: true },
              },
            },
          },
        },
      });
      return data;
    }
  } catch (error) {
    console.error('Error fetching employee monthly documents:', error);
    return [];
  }
};

export const fetchEmployeePermanentDocumentsByEmployeeId = async (employeeId: string) => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = await getActualRole(companyId as string, user?.id as string);


  try {
    if (role === 'Invitado') {
      const data = await prisma.documents_employees.findMany({
        where: {
          applies: employeeId,
          document_type: {
            is: { is_it_montlhy: false, private: false, is_active: true },
          },
        },
        include: {
          document_type: true,
          employee: {
            include: {
              contractor_employee: {
                include: { contractor: true },
              },
            },
          },
        },
      });
      return data;
    } else {
      const data = await prisma.documents_employees.findMany({
        where: {
          applies: employeeId,
          document_type: {
            is: { is_it_montlhy: false, is_active: true },
          },
        },
        include: {
          document_type: true,
          employee: {
            include: {
              contractor_employee: {
                include: { contractor: true },
              },
            },
          },
        },
      });
      return data;
    }
  } catch (error) {
    console.error('Error fetching employee permanent documents:', error);
    return [];
  }
};

export const fetchEmployeePermanentDocuments = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.documents_employees.findMany({
      where: {
        document_type: {
          is: { is_active: true, NOT: { is_it_montlhy: true } },
        },
        employee: {
          is: { company_id: companyId, is_active: true },
        },
      },
      include: {
        document_type: true,
        employee: {
          include: {
            contractor_employee: {
              include: { contractor: true },
            },
          },
        },
      },
    });
    return data;
  } catch (error) {
    console.error('Error fetching employee permanent documents:', error);
    return [];
  }
};

export const fetchMonthlyDocumentsByEquipmentId = async (equipmentId: string) => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = await getActualRole(companyId as string, user?.id as string);

  try {
    if (role === 'Invitado') {
      const data = await prisma.documents_equipment.findMany({
        where: {
          applies: equipmentId,
          document_type: {
            is: { is_it_montlhy: true, private: false, is_active: true },
          },
        },
        include: {
          document_type: true,
          vehicle: {
            include: {
              type_rel: true,
              type_of_vehicle_rel: true,
              model_rel: true,
              brand_rel: true,
            },
          },
        },
      });
      return data;
    } else {
      const data = await prisma.documents_equipment.findMany({
        where: {
          applies: equipmentId,
          document_type: {
            is: { is_it_montlhy: true, is_active: true },
          },
        },
        include: {
          document_type: true,
          vehicle: {
            include: {
              type_rel: true,
              type_of_vehicle_rel: true,
              model_rel: true,
              brand_rel: true,
            },
          },
        },
      });
      return data;
    }
  } catch (error) {
    console.error('Error fetching equipment monthly documents:', error);
    return [];
  }
};

export const fetchMonthlyDocumentsEquipment = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.documents_equipment.findMany({
      where: {
        document_type: {
          is: { is_it_montlhy: true, is_active: true },
        },
        vehicle: {
          is: { is_active: true, company_id: companyId },
        },
      },
      include: {
        document_type: true,
        vehicle: {
          include: {
            type_rel: true,
            type_of_vehicle_rel: true,
            model_rel: true,
            brand_rel: true,
          },
        },
      },
    });
    return data;
  } catch (error) {
    console.error('Error fetching equipment monthly documents:', error);
    return [];
  }
};

export const fetchPermanentDocumentsByEquipmentId = async (equipmentId: string) => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = await getActualRole(companyId as string, user?.id as string);

  try {
    if (role === 'Invitado') {
      const data = await prisma.documents_equipment.findMany({
        where: {
          applies: equipmentId,
          document_type: {
            is: { is_active: true, private: false, NOT: { is_it_montlhy: true } },
          },
        },
        include: {
          document_type: true,
          vehicle: {
            include: {
              type_rel: true,
              type_of_vehicle_rel: true,
              model_rel: true,
              brand_rel: true,
            },
          },
        },
      });
      return data;
    } else {
      const data = await prisma.documents_equipment.findMany({
        where: {
          applies: equipmentId,
          document_type: {
            is: { is_active: true, NOT: { is_it_montlhy: true } },
          },
        },
        include: {
          document_type: true,
          vehicle: {
            include: {
              type_rel: true,
              type_of_vehicle_rel: true,
              model_rel: true,
              brand_rel: true,
            },
          },
        },
      });
      return data;
    }
  } catch (error) {
    console.error('Error fetching equipment permanent documents:', error);
    return [];
  }
};

export const fetchPermanentDocumentsEquipment = async () => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const data = await prisma.documents_equipment.findMany({
      where: {
        vehicle: {
          is: { company_id: companyId, is_active: true },
        },
        document_type: {
          is: { is_active: true, NOT: { is_it_montlhy: true } },
        },
      },
      include: {
        document_type: true,
        vehicle: {
          include: {
            type_rel: true,
            type_of_vehicle_rel: true,
            model_rel: true,
            brand_rel: true,
          },
        },
      },
    });
    return data;
  } catch (error) {
    console.error('Error fetching equipment permanent documents:', error);
    return [];
  }
};

export const fetchallResources = async (applies: string) => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    if (applies === 'Persona') {
      const data = await prisma.employees.findMany({
        where: { company_id: companyId },
        select: { firstname: true, lastname: true, cuil: true, id: true },
      });
      return data;
    } else if (applies === 'Equipos') {
      const data = await prisma.vehicles.findMany({
        where: { company_id: companyId },
        select: { domain: true, serie: true, intern_number: true, id: true },
      });
      return data;
    }
  } catch (error) {
    console.error('Error al obtener datos adicionales:', error);
  }
};

export const fetchDocumentsByApplies = async (
  tableName: 'documents_employees' | 'documents_equipment',
  appliesId: string
) => {
  try {
    if (tableName === 'documents_employees') {
      const data = await prisma.documents_employees.findMany({
        where: { applies: appliesId, document_path: { not: null } },
      });
      return data;
    } else {
      const data = await prisma.documents_equipment.findMany({
        where: { applies: appliesId, document_path: { not: null } },
      });
      return data;
    }
  } catch (error) {
    console.error('Error fetching documents by applies:', error);
    return [];
  }
};

export const fetchDocumentTypesByCompany = async (companyId: string) => {
  if (!companyId) return [];
  try {
    const data = await prisma.document_types.findMany({
      where: {
        is_active: true,
        OR: [{ company_id: companyId }, { company_id: null }],
      },
    });
    return data ?? [];
  } catch (error) {
    console.error('Error fetching document types:', error);
    return [];
  }
};

export const fetchDocumentTypesByCompanyIncludingInactive = async (companyId: string) => {
  if (!companyId) return [];
  try {
    const data = await prisma.document_types.findMany({
      where: {
        OR: [{ company_id: companyId }, { company_id: null }],
      },
    });
    return data ?? [];
  } catch (error) {
    console.error('Error fetching document types:', error);
    return [];
  }
};

export const fetchDocumentEmployeesLogs = async (documentId: string) => {
  if (!documentId) return [];
  try {
    const data = await prisma.documents_employees_logs.findMany({
      where: { documents_employees_id: documentId },
      include: {
        documents_employees: {
          include: { user: { select: { email: true } } },
        },
      },
    });
    return data ?? [];
  } catch (error) {
    console.error('Error fetching document employees logs:', error);
    return [];
  }
};

export const fetchDocumentEquipmentLogs = async (documentId: string) => {
  if (!documentId) return [];
  try {
    const data = await prisma.documents_equipment_logs.findMany({
      where: { documents_equipment_id: documentId },
      include: {
        documents_equipment: {
          include: { user: { select: { email: true } } },
        },
      },
    });
    return data ?? [];
  } catch (error) {
    console.error('Error fetching document equipment logs:', error);
    return [];
  }
};

export const fetchAllDocumentsEmployeesByCompany = async (companyId: string) => {
  if (!companyId) return [];
  try {
    const data = await prisma.documents_employees.findMany({
      where: {
        employee: { company_id: companyId, is_active: true },
        document_type: { is_active: true },
      },
      include: {
        employee: {
          include: {
            contractor_employee: { include: { contractor: true } },
          },
        },
        document_type: true,
      },
    });
    return (data ?? []);
  } catch (error) {
    console.error('Error fetching employee documents:', error);
    return [];
  }
};

export const fetchAllDocumentsEquipmentByCompany = async (companyId: string) => {
  if (!companyId) return [];
  try {
    const data = await prisma.documents_equipment.findMany({
      where: {
        vehicle: { company_id: companyId, is_active: true },
        document_type: { is_active: true },
      },
      include: {
        document_type: true,
        vehicle: {
          include: {
            type_rel: true,
            type_of_vehicle_rel: true,
            model_rel: true,
            brand_rel: true,
          },
        },
      },
    });
    return (data ?? []);
  } catch (error) {
    console.error('Error fetching equipment documents:', error);
    return [];
  }
};

export const fetchDocumentEmployeesByDocNumber = async (documentNumber: string) => {
  if (!documentNumber) return [];
  try {
    const data = await prisma.documents_employees.findMany({
      where: {
        employee: { document_number: documentNumber },
      },
      include: {
        employee: true,
        document_type: true,
      },
    });
    return (data ?? []);
  } catch (error) {
    console.error('Error fetching document employees:', error);
    return [];
  }
};

export const fetchEquipmentDocsByVehicleId = async (vehicleId: string) => {
  if (!vehicleId) return [];
  try {
    const data = await prisma.documents_equipment.findMany({
      where: {
        vehicle: { id: vehicleId },
      },
      include: {
        document_type: true,
        vehicle: {
          include: {
            type_rel: true,
            type_of_vehicle_rel: true,
            model_rel: true,
            brand_rel: true,
          },
        },
      },
    });
    return (data ?? []);
  } catch (error) {
    console.error('Error fetching equipment docs:', error);
    return [];
  }
};

export const fetchDocumentEmployeesForCompany = async (companyId: string) => {
  try {
    const data = await prisma.documents_employees.findMany({
      where: {
        employee: { company_id: companyId },
      },
      include: {
        employee: { select: { id: true, company_id: true, document_number: true, lastname: true, firstname: true } },
        document_type: { select: { id: true, name: true } },
      },
    });
    // Filter out records where employee or document_type is null
    return data?.filter((d: any) => d.employee && d.document_type) ?? [];
  } catch (error) {
    console.error('Error fetching document employees for company:', error);
    return [];
  }
};

export const fetchDocumentEquipmentForCompany = async (companyId: string) => {
  try {
    const data = await prisma.documents_equipment.findMany({
      where: {
        vehicle: { company_id: companyId },
      },
      include: {
        vehicle: { select: { id: true, company_id: true, intern_number: true, domain: true } },
        document_type: { select: { id: true, name: true } },
      },
    });
    return data?.filter((d: any) => d.vehicle && d.document_type) ?? [];
  } catch (error) {
    console.error('Error fetching document equipment for company:', error);
    return [];
  }
};

// ============================================================================
// PAGINATED / FACETS / EXPORT — New DataTable server-side actions
// ============================================================================

/** Column map for employee document filters */
const employeeDocColumnMap: Record<string, string> = {
  state: 'state',
  documentName: 'document_type.name',
  mandatory: 'document_type.mandatory',
};

/** Map front-end sort column names to Prisma orderBy objects */
function mapEmployeeDocOrderBy(sortBy: string | null | undefined, sortOrder: string | null | undefined): Record<string, unknown> | undefined {
  if (!sortBy) return undefined;
  const order = sortOrder ?? 'asc';
  switch (sortBy) {
    case 'resource': return { employee: { lastname: order } };
    case 'documentName': return { document_type: { name: order } };
    case 'validity': return { validity: order };
    case 'date': return { created_at: order };
    case 'state': return { state: order };
    default: return { [sortBy]: order };
  }
}

/** Shared include clause for employee document paginated/export queries */
const employeeDocPaginatedInclude = {
  document_type: true,
  employee: {
    include: {
      contractor_employee: {
        include: { contractor: true },
      },
    },
  },
} as const;

/**
 * Build the monthly/permanent filter for the document_type relation.
 */
function buildDocTypeMonthlyFilter(monthly?: boolean) {
  if (monthly) {
    return { is_it_montlhy: true };
  }
  return { NOT: { is_it_montlhy: true } };
}

/**
 * Build the combined `where` clause for employee documents.
 */
function buildEmployeeDocumentsWhere(
  state: ReturnType<typeof parseSearchParams>,
  companyId: string,
  options?: { monthly?: boolean }
) {
  // 1. Base where — always scope to active employees + active doc types
  const docTypeFilter: Record<string, unknown> = {
    is_active: true,
    ...buildDocTypeMonthlyFilter(options?.monthly),
  };

  const baseWhere: Record<string, unknown> = {
    employee: { is: { company_id: companyId, is_active: true } },
    document_type: { is: docTypeFilter },
  };

  // 2. Global search (OR across employee firstname, lastname, document_type name)
  if (state.search) {
    baseWhere.OR = [
      { employee: { is: { firstname: { contains: state.search, mode: 'insensitive' } } } },
      { employee: { is: { lastname: { contains: state.search, mode: 'insensitive' } } } },
      { document_type: { is: { name: { contains: state.search, mode: 'insensitive' } } } },
    ];
  }

  // 3. Faceted filters: state (direct on documents_employees)
  const stateFilter = state.filters.state;
  if (stateFilter?.length) {
    baseWhere.state = stateFilter.length === 1 ? stateFilter[0] : { in: stateFilter };
  }

  // 4. Filter by mandatory (boolean on document_type relation)
  const mandatoryFilter = state.filters.mandatory;
  if (mandatoryFilter?.length) {
    const mandatoryBool = mandatoryFilter.includes('Si') ? true : mandatoryFilter.includes('No') ? false : undefined;
    if (mandatoryBool !== undefined) {
      (baseWhere.document_type as any).is.mandatory = mandatoryBool;
    }
  }

  // 5. Filter by documentName (name on document_type relation)
  const docNameFilter = state.filters.documentName;
  if (docNameFilter?.length) {
    (baseWhere.document_type as any).is.name = docNameFilter.length === 1 ? docNameFilter[0] : { in: docNameFilter };
  }

  return baseWhere;
}

/**
 * Paginated employee documents query for the new DataTable.
 * Returns `{ data, total }` where data is the current page (formatted) and total is the full count.
 */
export async function getEmployeeDocumentsPaginated(
  searchParams: DataTableSearchParams,
  options?: { monthly?: boolean }
) {
  const { companyId } = await getActionContext();
  if (!companyId) return { data: [], total: 0 };

  try {
    const state = parseSearchParams(searchParams);
    const { skip, take } = stateToPrismaParams(state);

    const where = buildEmployeeDocumentsWhere(state, companyId, options);
    const mappedOrderBy = mapEmployeeDocOrderBy(state.sortBy, state.sortOrder) ?? { created_at: 'desc' };

    const [data, total] = await Promise.all([
      prisma.documents_employees.findMany({
        where,
        include: employeeDocPaginatedInclude,
        skip,
        take,
        orderBy: mappedOrderBy,
      }),
      prisma.documents_employees.count({ where }),
    ]);

    const formattedData = data.map(formatEmployeeDocuments);

    return { data: formattedData, total };
  } catch (error) {
    console.error('Error in getEmployeeDocumentsPaginated:', error);
    return { data: [], total: 0 };
  }
}

/**
 * Facet counts for employee document filter options.
 * Returns a record keyed by field name, each containing an array of { value, count }.
 */
export async function getEmployeeDocumentFacets(
  options?: { monthly?: boolean }
): Promise<Record<string, { value: string; count: number }[]>> {
  const { companyId } = await getActionContext();
  if (!companyId) return {};

  try {
    const docTypeFilter: Record<string, unknown> = {
      is_active: true,
      ...buildDocTypeMonthlyFilter(options?.monthly),
    };

    const baseWhere = {
      employee: { is: { company_id: companyId, is_active: true } },
      document_type: { is: docTypeFilter },
    };

    // Group by state — don't filter nulls in where (enum field gotcha)
    const stateCounts = await (prisma.documents_employees.groupBy as any)({
      by: ['state'],
      where: baseWhere,
      _count: { _all: true },
    });

    // Count mandatory vs non-mandatory via separate counts
    const [mandatoryCount, nonMandatoryCount] = await Promise.all([
      prisma.documents_employees.count({
        where: {
          ...baseWhere,
          document_type: { is: { ...docTypeFilter, mandatory: true } },
        },
      }),
      prisma.documents_employees.count({
        where: {
          ...baseWhere,
          document_type: { is: { ...docTypeFilter, mandatory: false } },
        },
      }),
    ]);

    // Get document names with counts
    const docNameCounts = await prisma.documents_employees.groupBy({
      by: ['id_document_types'],
      where: baseWhere,
      _count: { _all: true },
    });

    // Resolve document type IDs to names
    const docTypeIds = (docNameCounts as any[])
      .map((r: any) => r.id_document_types)
      .filter((id: any): id is string => id !== null);

    const docTypeRecords = docTypeIds.length > 0
      ? await prisma.document_types.findMany({
          where: { id: { in: docTypeIds } },
          select: { id: true, name: true },
        })
      : [];

    const docTypeNameMap = new Map(docTypeRecords.map((dt) => [dt.id, dt.name]));

    // Helper to convert groupBy result to facet array
    const toFacetArray = (counts: any[], field: string) =>
      counts
        .filter((item) => item[field] != null && item[field] !== '')
        .map((item) => ({
          value: String(item[field]),
          count: item._count?._all ?? item._count ?? 0,
        }));

    // Build mandatory facet
    const mandatoryFacets: { value: string; count: number }[] = [];
    if (mandatoryCount > 0) mandatoryFacets.push({ value: 'Si', count: mandatoryCount });
    if (nonMandatoryCount > 0) mandatoryFacets.push({ value: 'No', count: nonMandatoryCount });

    return {
      state: toFacetArray(stateCounts, 'state'),
      mandatory: mandatoryFacets,
      documentName: (docNameCounts as any[])
        .filter((r: any) => r.id_document_types !== null)
        .map((r: any) => ({
          value: docTypeNameMap.get(r.id_document_types!) ?? r.id_document_types!,
          count: r._count?._all ?? r._count ?? 0,
        })),
    };
  } catch (error) {
    console.error('Error in getEmployeeDocumentFacets:', error);
    return {};
  }
}

/**
 * Same query as getEmployeeDocumentsPaginated but WITHOUT pagination (skip/take).
 * Used for Excel export with current filters applied.
 */
export async function getAllEmployeeDocumentsForExport(
  searchParams: DataTableSearchParams,
  options?: { monthly?: boolean }
) {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const state = parseSearchParams(searchParams);
    const where = buildEmployeeDocumentsWhere(state, companyId, options);
    const mappedOrderBy = mapEmployeeDocOrderBy(state.sortBy, state.sortOrder) ?? { created_at: 'desc' };

    const data = await prisma.documents_employees.findMany({
      where,
      include: employeeDocPaginatedInclude,
      orderBy: mappedOrderBy,
    });

    return data.map(formatEmployeeDocuments);
  } catch (error) {
    console.error('Error in getAllEmployeeDocumentsForExport:', error);
    return [];
  }
}
