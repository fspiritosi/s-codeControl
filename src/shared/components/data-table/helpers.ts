/**
 * Helpers para DataTable - Funciones puras que pueden ejecutarse en servidor o cliente
 * NO incluye 'use client' para que puedan ser importadas desde server actions
 */

import type { DataTableSearchParams, DataTableState, TablePaginationParams } from './types';

// ============================================================================
// CONSTANTES
// ============================================================================

export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE = 0;

// ============================================================================
// PARSE HELPERS
// ============================================================================

/**
 * Parsea los searchParams de la URL a un estado estructurado
 */
export function parseSearchParams(
  searchParams: DataTableSearchParams
): DataTableState {
  const page = searchParams.page ? Math.max(0, Number(searchParams.page) - 1) : DEFAULT_PAGE;

  const pageSize = searchParams.pageSize
    ? Number(searchParams.pageSize)
    : DEFAULT_PAGE_SIZE;

  const sortBy = (searchParams.sortBy as string) || null;
  const sortOrder = (searchParams.sortOrder as 'asc' | 'desc') || 'asc';

  const search = (searchParams.search as string) || '';

  const reservedKeys = ['page', 'pageSize', 'sortBy', 'sortOrder', 'search'];
  const filters: Record<string, string[]> = {};

  Object.entries(searchParams).forEach(([key, value]) => {
    if (!reservedKeys.includes(key) && value) {
      filters[key] = Array.isArray(value) ? value : String(value).split(',');
    }
  });

  return { page, pageSize, sortBy, sortOrder, search, filters };
}

/**
 * Convierte el estado a searchParams de URL
 */
export function stateToSearchParams(state: Partial<DataTableState>): URLSearchParams {
  const params = new URLSearchParams();

  if (state.page !== undefined && state.page > 0) {
    params.set('page', String(state.page + 1));
  }

  if (state.pageSize !== undefined && state.pageSize !== DEFAULT_PAGE_SIZE) {
    params.set('pageSize', String(state.pageSize));
  }

  if (state.sortBy) {
    params.set('sortBy', state.sortBy);
    params.set('sortOrder', state.sortOrder || 'asc');
  }

  if (state.search) {
    params.set('search', state.search);
  }

  if (state.filters) {
    Object.entries(state.filters).forEach(([key, values]) => {
      if (values.length > 0) {
        params.set(key, values.join(','));
      }
    });
  }

  return params;
}

// ============================================================================
// PRISMA HELPERS (compatibilidad con BaseERP)
// ============================================================================

/**
 * Convierte DataTableState a parametros de Prisma
 */
export function stateToPrismaParams(state: DataTableState) {
  const params: {
    skip: number;
    take: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
  } = {
    skip: state.page * state.pageSize,
    take: state.pageSize,
  };

  if (state.sortBy) {
    params.orderBy = { [state.sortBy]: state.sortOrder };
  }

  return params;
}

/**
 * Convierte DataTableState a parametros de paginacion genericos.
 * Funciona con Prisma Y Supabase.
 */
export function stateToPaginationParams(state: DataTableState): TablePaginationParams {
  const params: TablePaginationParams = {
    skip: state.page * state.pageSize,
    take: state.pageSize,
  };

  if (state.sortBy) {
    params.orderBy = { field: state.sortBy, direction: state.sortOrder };
  }

  return params;
}

/**
 * Construye clausula where para busqueda en multiples campos (formato Prisma)
 */
export function buildSearchWhere(search: string, fields: string[]) {
  if (!search) return {};

  return {
    OR: fields.map((field) => ({
      [field]: {
        contains: search,
        mode: 'insensitive' as const,
      },
    })),
  };
}

/**
 * Construye clausula where para filtros de columnas (formato Prisma)
 */
export function buildFiltersWhere(
  filters: Record<string, string[]>,
  columnMap: Record<string, string> = {},
  options?: { exclude?: string[] }
) {
  const excluded = new Set(options?.exclude ?? []);
  const hasAllowlist = Object.keys(columnMap).length > 0;
  const where: Record<string, unknown> = {};

  Object.entries(filters).forEach(([columnId, values]) => {
    if (columnId.endsWith('_from') || columnId.endsWith('_to')) return;
    if (excluded.has(columnId)) return;
    // Si hay columnMap definido, tratarlo como allowlist: ignorar columnas no mapeadas
    // para evitar que query params ajenos (ej. de otra tab) rompan la query de Prisma.
    if (hasAllowlist && !(columnId in columnMap)) return;

    if (values.length > 0) {
      const field = columnMap[columnId] || columnId;
      where[field] = values.length === 1 ? values[0] : { in: values };
    }
  });

  return where;
}

/**
 * Construye clausula where para filtros de texto libre (formato Prisma)
 */
export function buildTextFiltersWhere(
  filters: Record<string, string[]>,
  textColumns: string[],
  columnMap: Record<string, string> = {}
) {
  const where: Record<string, unknown> = {};

  textColumns.forEach((columnId) => {
    const values = filters[columnId];
    if (values?.length && values[0]) {
      const field = columnMap[columnId] || columnId;
      where[field] = { contains: values[0], mode: 'insensitive' };
    }
  });

  return where;
}

/**
 * Construye clausula where para filtros de rango de fechas (formato Prisma)
 */
export function buildDateRangeFiltersWhere(
  filters: Record<string, string[]>,
  dateColumns: string[],
  columnMap: Record<string, string> = {}
) {
  const where: Record<string, unknown> = {};

  dateColumns.forEach((columnId) => {
    const fromValues = filters[`${columnId}_from`];
    const toValues = filters[`${columnId}_to`];

    const fromStr = fromValues?.[0];
    const toStr = toValues?.[0];

    if (!fromStr && !toStr) return;

    const field = columnMap[columnId] || columnId;
    const rangeFilter: Record<string, Date> = {};

    if (fromStr) {
      const fromDate = new Date(fromStr);
      if (!isNaN(fromDate.getTime())) {
        fromDate.setUTCHours(0, 0, 0, 0);
        rangeFilter.gte = fromDate;
      }
    }

    if (toStr) {
      const toDate = new Date(toStr);
      if (!isNaN(toDate.getTime())) {
        toDate.setUTCHours(23, 59, 59, 999);
        rangeFilter.lte = toDate;
      }
    }

    if (Object.keys(rangeFilter).length > 0) {
      where[field] = rangeFilter;
    }
  });

  return where;
}

// ============================================================================
// SUPABASE HELPERS
// ============================================================================

/**
 * Convierte DataTableState a rango de Supabase (.range(from, to))
 */
export function stateToSupabaseRange(state: DataTableState): { from: number; to: number } {
  const from = state.page * state.pageSize;
  const to = from + state.pageSize - 1;
  return { from, to };
}
