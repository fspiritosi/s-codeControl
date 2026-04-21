'use client';

import type { ColumnFiltersState, PaginationState, SortingState } from '@tanstack/react-table';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

import { DEFAULT_PAGE_SIZE, parseSearchParams, stateToSearchParams } from './helpers';
import type { DataTableSearchParams, DataTableState } from './types';

// Re-export helpers para conveniencia
export {
  buildDateRangeFiltersWhere,
  buildFiltersWhere,
  buildSearchWhere,
  buildTextFiltersWhere,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  parseSearchParams,
  stateToPaginationParams,
  stateToPrismaParams,
  stateToSearchParams,
  stateToSupabaseRange,
} from './helpers';

// ============================================================================
// HOOK: useDataTable
// ============================================================================

interface UseDataTableOptions {
  defaultPageSize?: number;
  filterableColumns?: string[];
}

interface UseDataTableReturn {
  state: DataTableState;
  pagination: PaginationState;
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  onPaginationChange: (
    updater: PaginationState | ((old: PaginationState) => PaginationState)
  ) => void;
  onSortingChange: (updater: SortingState | ((old: SortingState) => SortingState)) => void;
  onColumnFiltersChange: (
    updater: ColumnFiltersState | ((old: ColumnFiltersState) => ColumnFiltersState)
  ) => void;
  onGlobalFilterChange: (value: string) => void;
  resetFilters: () => void;
}

/**
 * Hook para manejar el estado del DataTable sincronizado con la URL.
 * Solo se invoca en modo server-side (cuando totalRows esta presente).
 */
export function useDataTable(options: UseDataTableOptions = {}): UseDataTableReturn {
  const { defaultPageSize = DEFAULT_PAGE_SIZE, filterableColumns = [] } = options;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parsear estado actual de la URL
  const state = useMemo(() => {
    const params: DataTableSearchParams = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    const parsed = parseSearchParams(params);
    if (!searchParams.has('pageSize')) {
      parsed.pageSize = defaultPageSize;
    }
    return parsed;
  }, [searchParams, defaultPageSize]);

  // Convertir a formatos de TanStack Table
  const pagination: PaginationState = useMemo(
    () => ({
      pageIndex: state.page,
      pageSize: state.pageSize,
    }),
    [state.page, state.pageSize]
  );

  const sorting: SortingState = useMemo(
    () => (state.sortBy ? [{ id: state.sortBy, desc: state.sortOrder === 'desc' }] : []),
    [state.sortBy, state.sortOrder]
  );

  const columnFilters: ColumnFiltersState = useMemo(() => {
    const filters: ColumnFiltersState = [];

    if (state.search) {
      filters.push({ id: 'global', value: state.search });
    }

    Object.entries(state.filters).forEach(([columnId, values]) => {
      if (filterableColumns.length === 0 || filterableColumns.includes(columnId)) {
        filters.push({ id: columnId, value: values });
      }
    });

    return filters;
  }, [state.search, state.filters, filterableColumns]);

  // Funcion helper para actualizar URL
  const updateURL = useCallback(
    (newState: Partial<DataTableState>) => {
      const merged = { ...state, ...newState };
      const params = stateToSearchParams(merged);
      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [state, pathname, router]
  );

  // Handlers
  const onPaginationChange = useCallback(
    (updater: PaginationState | ((old: PaginationState) => PaginationState)) => {
      const newPagination = typeof updater === 'function' ? updater(pagination) : updater;
      updateURL({
        page: newPagination.pageIndex,
        pageSize: newPagination.pageSize,
      });
    },
    [pagination, updateURL]
  );

  const onSortingChange = useCallback(
    (updater: SortingState | ((old: SortingState) => SortingState)) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
      if (newSorting.length > 0) {
        updateURL({
          sortBy: newSorting[0].id,
          sortOrder: newSorting[0].desc ? 'desc' : 'asc',
          page: 0,
        });
      } else {
        updateURL({
          sortBy: null,
          sortOrder: 'asc',
          page: 0,
        });
      }
    },
    [sorting, updateURL]
  );

  const onColumnFiltersChange = useCallback(
    (updater: ColumnFiltersState | ((old: ColumnFiltersState) => ColumnFiltersState)) => {
      const newFilters = typeof updater === 'function' ? updater(columnFilters) : updater;

      const filters: Record<string, string[]> = {};
      let search = '';

      newFilters.forEach((filter) => {
        if (filter.id === 'global') {
          search = filter.value as string;
        } else {
          const value = filter.value;
          filters[filter.id] = Array.isArray(value) ? value : [String(value)];
        }
      });

      updateURL({
        filters,
        search,
        page: 0,
      });
    },
    [columnFilters, updateURL]
  );

  const onGlobalFilterChange = useCallback(
    (value: string) => {
      updateURL({
        search: value,
        page: 0,
      });
    },
    [updateURL]
  );

  const resetFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [pathname, router]);

  return {
    state,
    pagination,
    sorting,
    columnFilters,
    onPaginationChange,
    onSortingChange,
    onColumnFiltersChange,
    onGlobalFilterChange,
    resetFilters,
  };
}
