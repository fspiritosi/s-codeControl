// ============================================================================
// DataTable - Server-Side Data Table Component
// ============================================================================
// Documentación completa: ./DOCS.md
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
  stateToPrismaParams,
  stateToSearchParams,
} from './helpers';

// Types
export type {
  // Column types
  DataTableColumnConfig,
  DataTableColumnHeaderProps,
  DataTableFacetedFilterConfig,
  DataTableFacetedFilterProps,
  // Export types
  DataTableExportConfig,
  DataTableExportOptions,
  // Filter types
  DataTableFilterOption,
  DataTablePaginationProps,
  // Component props
  DataTableProps,
  // Server action types
  DataTableQueryParams,
  DataTableQueryResult,
  // Search params
  DataTableSearchParams,
  DataTableState,
  DataTableToolbarProps,
  DataTableViewOptionsProps,
  PrismaTableParams,
} from './types';

// Excel export utilities
export {
  exportToExcel,
  tanstackColumnsToExcelColumns,
  type ExcelColumn,
  type ExcelExportOptions,
} from '@/shared/lib/excel-export';
