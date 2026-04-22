// ============================================================================
// DataTable - Dual-mode Data Table Component (client-side + server-side)
// ============================================================================

// Componente principal
export { DataTable } from './DataTable';

// Sub-componentes (para uso individual si es necesario)
export { DataTableColumnHeader } from './DataTableColumnHeader';
export { DataTableDateRangeFilter } from './DataTableDateRangeFilter';
export { DataTableFacetedFilter } from './DataTableFacetedFilter';
export { DataTableTextFilter } from './DataTableTextFilter';
export { DataTableFilterOptions } from './DataTableFilterOptions';
export { DataTablePagination } from './DataTablePagination';
export { DataTableToolbar } from './DataTableToolbar';
export { DataTableViewOptions } from './DataTableViewOptions';

// Hook (solo cliente)
export { useDataTable } from './useDataTable';

// Helpers puros (pueden usarse en servidor o cliente)
// IMPORTANTE: Para server actions, importar directamente de ./helpers
export {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  buildDateRangeFiltersWhere,
  buildFiltersWhere,
  buildSearchWhere,
  buildTextFiltersWhere,
  parseSearchParams,
  stateToPaginationParams,
  stateToPrismaParams,
  stateToSearchParams,
  stateToSupabaseRange,
} from './helpers';

// Table preferences
export {
  getTablePreferences,
  saveTableColumnVisibility,
  saveTableFilterVisibility,
} from './table-preferences';

// Types
export type {
  DataTableColumnConfig,
  DataTableColumnHeaderProps,
  DataTableExportConfig,
  DataTableExportOptions,
  DataTableFacetedFilterConfig,
  DataTableFacetedFilterProps,
  DataTableFilterOption,
  DataTablePaginationProps,
  DataTableProps,
  DataTableQueryParams,
  DataTableQueryResult,
  DataTableSearchParams,
  DataTableState,
  DataTableToolbarProps,
  DataTableViewOptionsProps,
  PrismaTableParams,
  TablePaginationParams,
  TablePreferences,
} from './types';
