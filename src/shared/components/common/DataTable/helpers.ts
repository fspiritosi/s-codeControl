/**
 * Helpers para DataTable - Funciones puras que pueden ejecutarse en servidor o cliente
 * NO incluye 'use client' para que puedan ser importadas desde server actions
 */

import type { DataTableSearchParams, DataTableState } from './types';

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
  // Parsear página (1-indexed en URL, 0-indexed internamente)
  const page = searchParams.page ? Math.max(0, Number(searchParams.page) - 1) : DEFAULT_PAGE;

  // Parsear pageSize
  const pageSize = searchParams.pageSize
    ? Number(searchParams.pageSize)
    : DEFAULT_PAGE_SIZE;

  // Parsear sorting
  const sortBy = (searchParams.sortBy as string) || null;
  const sortOrder = (searchParams.sortOrder as 'asc' | 'desc') || 'asc';

  // Parsear búsqueda
  const search = (searchParams.search as string) || '';

  // Parsear filtros (todos los params que no son los estándar)
  // Los params _from y _to son parte del sistema de date range y se procesan por separado
  const reservedKeys = ['page', 'pageSize', 'sortBy', 'sortOrder', 'search'];
  const filters: Record<string, string[]> = {};

  Object.entries(searchParams).forEach(([key, value]) => {
    if (!reservedKeys.includes(key) && value) {
      // Si es un array, usar directo; si es string, convertir a array
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

  // Página (convertir de 0-indexed a 1-indexed para URL)
  if (state.page !== undefined && state.page > 0) {
    params.set('page', String(state.page + 1));
  }

  // PageSize (solo si es diferente al default)
  if (state.pageSize !== undefined && state.pageSize !== DEFAULT_PAGE_SIZE) {
    params.set('pageSize', String(state.pageSize));
  }

  // Sorting
  if (state.sortBy) {
    params.set('sortBy', state.sortBy);
    params.set('sortOrder', state.sortOrder || 'asc');
  }

  // Búsqueda
  if (state.search) {
    params.set('search', state.search);
  }

  // Filtros
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
// PRISMA HELPERS
// ============================================================================

/**
 * Convierte DataTableState a parámetros de Prisma
 *
 * @example
 * ```tsx
 * // En un server action
 * export async function getEmployees(searchParams: DataTableSearchParams) {
 *   const state = parseSearchParams(searchParams);
 *   const prismaParams = stateToPrismaParams(state);
 *
 *   const [data, total] = await Promise.all([
 *     prisma.employee.findMany({
 *       ...prismaParams,
 *       where: {
 *         ...prismaParams.where,
 *         companyId,
 *       },
 *     }),
 *     prisma.employee.count({ where: { ...prismaParams.where, companyId } }),
 *   ]);
 *
 *   return { data, total };
 * }
 * ```
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
 * Construye cláusula where para búsqueda en múltiples campos
 *
 * @example
 * ```tsx
 * const searchWhere = buildSearchWhere(state.search, ['name', 'email', 'documentNumber']);
 * // Resultado: { OR: [{ name: { contains: 'juan', mode: 'insensitive' } }, ...] }
 * ```
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
 * Construye cláusula where para filtros de columnas
 *
 * @example
 * ```tsx
 * const filtersWhere = buildFiltersWhere(state.filters, {
 *   status: 'status',           // directo
 *   department: 'departmentId', // mapeo a otro campo
 * });
 * ```
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
    // Ignorar los params _from/_to aquí: se procesan con buildDateRangeFiltersWhere
    if (columnId.endsWith('_from') || columnId.endsWith('_to')) return;
    // Ignorar params de navegación que no son filtros de DB
    if (columnId === 'tab') return;
    // Ignorar columnas excluidas (ej. columnas de texto que se procesan con buildTextFiltersWhere)
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
 * Construye cláusula where para filtros de texto libre (contains insensitive)
 * Usar para columnas de tipo texto donde el filtro es un substring, NO un valor exacto.
 *
 * @example
 * ```tsx
 * // filters: { phone: ['123'] }
 * const textWhere = buildTextFiltersWhere(state.filters, ['phone', 'email']);
 * // Resultado: { phone: { contains: '123', mode: 'insensitive' } }
 * ```
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
 * Construye cláusula where para filtros de rango de fechas
 * Lee los params _from y _to del objeto de filtros
 *
 * @example
 * ```tsx
 * // filters: { createdAt_from: ['2024-01-01'], createdAt_to: ['2024-12-31'] }
 * const dateWhere = buildDateRangeFiltersWhere(state.filters, ['createdAt']);
 * // Resultado: { createdAt: { gte: new Date('2024-01-01'), lte: new Date('2024-12-31') } }
 *
 * // Con mapeo a otro campo de Prisma:
 * const dateWhere = buildDateRangeFiltersWhere(state.filters, ['hireDate'], { hireDate: 'startDate' });
 * ```
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
