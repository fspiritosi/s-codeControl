'use server';
import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable/types';
import {
  parseSearchParams,
  stateToPrismaParams,
  buildSearchWhere,
  buildFiltersWhere,
  buildTextFiltersWhere,
} from '@/shared/components/common/DataTable/helpers';
import { ensurePendingDocumentsForType } from '@/shared/lib/documentAlerts';

// ============================================
// TYPES
// ============================================

export interface CreateDocumentTypeInput {
  name: string;
  applies: string; // 'Persona' | 'Equipos' | 'Empresa'
  mandatory: boolean;
  explired: boolean;
  is_it_montlhy: boolean;
  private: boolean;
  down_document: boolean;
  multiresource: boolean;
  special: boolean;
  description?: string;
  conditions?: { field: string; values: string[]; type: 'enum' | 'relation' }[];
}

// ============================================
// QUERIES
// ============================================

/**
 * Get a single document type by id.
 */
export async function getDocumentTypeById(id: string) {
  try {
    const docType = await prisma.document_types.findUnique({ where: { id } });
    return docType;
  } catch (error) {
    console.error('Error in getDocumentTypeById:', error);
    return null;
  }
}

/**
 * Column map for faceted filters: front-end filter key → Prisma column name.
 */
const docTypeColumnMap: Record<string, string> = {
  applies: 'applies',
  mandatory: 'mandatory',
  is_active: 'is_active',
};

/** Search fields for global search */
const docTypeSearchFields = ['name'];

/** Text-based filter columns (contains insensitive) */
const docTypeTextFilterColumns = ['name'];

/**
 * Build the combined `where` clause for document_types, shared between
 * paginated and export queries.
 */
function buildDocumentTypesWhere(
  state: ReturnType<typeof parseSearchParams>,
  companyId: string,
  appliesFilter?: string
) {
  // 1. Base where: company's own types + global (company_id is null)
  const baseWhere: Record<string, unknown> = {
    OR: [{ company_id: companyId }, { company_id: null }],
  };

  // Handle is_active filter: default active, allow 'false' or 'all'
  const isActiveFilter = state.filters.is_active;
  if (isActiveFilter?.includes('false')) {
    baseWhere.is_active = false;
  } else if (isActiveFilter?.includes('all')) {
    // No is_active constraint — show all
  } else {
    baseWhere.is_active = true;
  }

  // 2. Applies filter from tab/prop
  if (appliesFilter) {
    baseWhere.applies = appliesFilter;
  }

  // 3. Global search (OR across text fields)
  const searchWhere = state.search
    ? buildSearchWhere(state.search, docTypeSearchFields)
    : {};

  // 4. Faceted / discrete filters
  const filtersWhere = buildFiltersWhere(state.filters, docTypeColumnMap, {
    exclude: ['is_active'],
  });

  // Convert boolean filter strings to actual booleans
  if (filtersWhere.mandatory !== undefined) {
    filtersWhere.mandatory = filtersWhere.mandatory === 'true';
  }

  // 5. Text-based filters (contains insensitive)
  const textFiltersWhere = buildTextFiltersWhere(state.filters, docTypeTextFilterColumns);

  return {
    ...baseWhere,
    ...searchWhere,
    ...filtersWhere,
    ...textFiltersWhere,
  };
}

/**
 * Paginated document types query for the DataTable.
 * Returns `{ data, total }`.
 */
export async function getDocumentTypesPaginated(
  searchParams: DataTableSearchParams,
  appliesFilter?: string
) {
  const { companyId } = await getActionContext();
  if (!companyId) return { data: [], total: 0 };

  try {
    const state = parseSearchParams(searchParams);
    const { skip, take, orderBy } = stateToPrismaParams(state);

    const where = buildDocumentTypesWhere(state, companyId, appliesFilter);

    const [data, total] = await Promise.all([
      prisma.document_types.findMany({
        where,
        skip,
        take,
        orderBy: orderBy ?? { name: 'asc' },
      }),
      prisma.document_types.count({ where }),
    ]);

    return { data, total };
  } catch (error) {
    console.error('Error in getDocumentTypesPaginated:', error);
    return { data: [], total: 0 };
  }
}

/**
 * Facet counts for document type filter options.
 * Returns a record keyed by field name, each containing an array of { value, count }.
 */
export async function getDocumentTypeFacets(
  appliesFilter?: string
): Promise<Record<string, { value: string; count: number }[]>> {
  const { companyId } = await getActionContext();
  if (!companyId) return {};

  try {
    const baseWhere: Record<string, unknown> = {
      OR: [{ company_id: companyId }, { company_id: null }],
      is_active: true,
    };

    if (appliesFilter) {
      baseWhere.applies = appliesFilter;
    }

    const groupByField = async (field: string) => {
      const result = await (prisma.document_types.groupBy as any)({
        by: [field],
        where: baseWhere,
        _count: { _all: true },
      });
      return result;
    };

    const [appliesCounts, mandatoryCounts, isActiveCounts] = await Promise.all([
      groupByField('applies'),
      groupByField('mandatory'),
      groupByField('is_active'),
    ]);

    const toFacetArray = (counts: any[], field: string) =>
      counts
        .filter((item) => item[field] != null && item[field] !== '')
        .map((item) => ({
          value: String(item[field]),
          count: item._count?._all ?? item._count ?? 0,
        }));

    return {
      applies: toFacetArray(appliesCounts, 'applies'),
      mandatory: toFacetArray(mandatoryCounts, 'mandatory'),
      is_active: toFacetArray(isActiveCounts, 'is_active'),
    };
  } catch (error) {
    console.error('Error in getDocumentTypeFacets:', error);
    return {};
  }
}

/**
 * Same query as getDocumentTypesPaginated but WITHOUT pagination (skip/take).
 * Used for Excel export with current filters applied.
 */
export async function getAllDocumentTypesForExport(
  searchParams: DataTableSearchParams,
  appliesFilter?: string
) {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    const state = parseSearchParams(searchParams);
    const where = buildDocumentTypesWhere(state, companyId, appliesFilter);

    const orderBy = state.sortBy
      ? { [state.sortBy]: state.sortOrder }
      : { name: 'asc' as const };

    const data = await prisma.document_types.findMany({
      where,
      orderBy,
    });

    return data;
  } catch (error) {
    console.error('Error in getAllDocumentTypesForExport:', error);
    return [];
  }
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new document type.
 */
export async function createDocumentType(input: CreateDocumentTypeInput) {
  const { companyId } = await getActionContext();
  if (!companyId) return { data: null, error: 'No company context' };

  try {
    if (!input.name.trim()) {
      return { data: null, error: 'El nombre no puede estar vacío' };
    }

    // Check duplicate name for same company
    const existing = await prisma.document_types.findFirst({
      where: { name: input.name, company_id: companyId },
      select: { id: true },
    });

    if (existing) {
      return { data: null, error: 'Ya existe un tipo de documento con ese nombre' };
    }

    // If applies === 'Empresa', force multiresource and down_document to false
    const multiresource = input.applies === 'Empresa' ? false : input.multiresource;
    const down_document = input.applies === 'Empresa' ? false : input.down_document;

    // If not conditional, force conditions to empty
    const conditions = input.special ? (input.conditions ?? []) : [];

    const created = await prisma.document_types.create({
      data: {
        name: input.name,
        applies: input.applies as any,
        mandatory: input.mandatory,
        explired: input.explired,
        special: input.special,
        is_active: true,
        description: input.description,
        company_id: companyId,
        private: input.private,
        is_it_montlhy: input.is_it_montlhy,
        down_document,
        multiresource,
        conditions,
      },
    });

    if (created.mandatory && created.is_active) {
      await ensurePendingDocumentsForType(created.id);
    }

    return { data: created, error: null };
  } catch (error) {
    console.error('Error creating document type:', error);
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Update an existing document type.
 */
export async function updateDocumentType(
  id: string,
  input: CreateDocumentTypeInput
) {
  const { companyId } = await getActionContext();
  if (!companyId) return { error: 'No company context' };

  try {
    if (!input.name.trim()) {
      return { error: 'El nombre no puede estar vacío' };
    }

    // Check duplicate name excluding current record
    const duplicate = await prisma.document_types.findFirst({
      where: {
        name: input.name,
        company_id: companyId,
        id: { not: id },
      },
      select: { id: true },
    });

    if (duplicate) {
      return { error: 'Ya existe un tipo de documento con ese nombre' };
    }

    // If applies === 'Empresa', force multiresource and down_document to false
    const multiresource = input.applies === 'Empresa' ? false : input.multiresource;
    const down_document = input.applies === 'Empresa' ? false : input.down_document;

    // If not conditional, force conditions to empty
    const conditions = input.special ? (input.conditions ?? []) : [];

    const updated = await prisma.document_types.update({
      where: { id },
      data: {
        name: input.name,
        applies: input.applies as any,
        mandatory: input.mandatory,
        explired: input.explired,
        special: input.special,
        description: input.description,
        private: input.private,
        is_it_montlhy: input.is_it_montlhy,
        down_document,
        multiresource,
        conditions,
      },
    });

    if (updated.mandatory && updated.is_active) {
      await ensurePendingDocumentsForType(updated.id);
    }

    return { error: null };
  } catch (error) {
    console.error('Error updating document type:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Delete a document type, only if no documents are associated.
 */
export async function deleteDocumentType(id: string) {
  try {
    // Check for associated employee documents
    const hasEmployeeDocs = await prisma.documents_employees.findFirst({
      where: { id_document_types: id },
      select: { id: true },
    });

    // Check for associated equipment documents
    const hasEquipmentDocs = await prisma.documents_equipment.findFirst({
      where: { id_document_types: id },
      select: { id: true },
    });

    // Check for associated company documents
    const hasCompanyDocs = await prisma.documents_company.findFirst({
      where: { id_document_types: id },
      select: { id: true },
    });

    if (hasEmployeeDocs || hasEquipmentDocs || hasCompanyDocs) {
      return { error: 'No se puede eliminar: hay documentos asociados a este tipo' };
    }

    await prisma.document_types.delete({ where: { id } });

    return { error: null };
  } catch (error) {
    console.error('Error deleting document type:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

// ============================================
// EXISTING — kept unchanged
// ============================================

export const updateDocumentTypeActive = async (id: string, isActive: boolean) => {
  try {
    await prisma.document_types.update({
      where: { id },
      data: { is_active: isActive },
    });
    return { error: null };
  } catch (error) {
    console.error('Error updating document type active state:', error);
    return { error: String(error) };
  }
};

export const fettchExistingEntries = async (applies: string, id_document_types: string) => {
  const { companyId } = await getActionContext();
  if (!companyId) return [];

  try {
    if (applies === 'Equipos') {
      const data = await prisma.documents_equipment.findMany({
        where: {
          id_document_types,
          vehicle: {
            is: { company_id: companyId, is_active: true },
          },
        },
        include: { vehicle: true },
      });
      return data.map((d) => ({ id: d.id, applies: d.vehicle }));
    } else if (applies === 'Persona') {
      const data = await prisma.documents_employees.findMany({
        where: {
          id_document_types,
          employee: {
            is: { company_id: companyId, is_active: true },
          },
        },
        include: { employee: true },
      });
      return data.map((d) => ({ id: d.id, applies: d.employee }));
    }
    return [];
  } catch (error) {
    console.error('Error al obtener los recursos con documentos:', error);
    return;
  }
};
