import type { Column, ColumnDef, Row, Table } from '@tanstack/react-table';
import type { LucideIcon } from 'lucide-react';

// ============================================================================
// SEARCH PARAMS TYPES
// ============================================================================

/**
 * Parametros de URL para el DataTable server-side.
 * En Next.js 14, searchParams es un objeto directo (no Promise).
 */
export interface DataTableSearchParams {
  page?: string;
  pageSize?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  [key: string]: string | string[] | undefined;
}

/**
 * Estado parseado de los search params
 */
export interface DataTableState {
  page: number;
  pageSize: number;
  sortBy: string | null;
  sortOrder: 'asc' | 'desc';
  search: string;
  filters: Record<string, string[]>;
}

// ============================================================================
// FILTER TYPES
// ============================================================================

/**
 * Opcion de filtro faceteado
 */
export interface DataTableFilterOption {
  value: string;
  label: string;
  icon?: LucideIcon;
  color?: string;
}

/**
 * Configuracion de un filtro faceteado
 */
export interface DataTableFacetedFilterConfig {
  columnId: string;
  title: string;
  type?: 'faceted' | 'dateRange' | 'text';
  placeholder?: string;
  options?: DataTableFilterOption[];
  externalCounts?: Map<string, number>;
}

// ============================================================================
// COLUMN TYPES
// ============================================================================

/**
 * Configuracion extendida para columnas del DataTable.
 */
export interface DataTableColumnConfig<TData> {
  id: string;
  title: string;
  accessorKey?: keyof TData | string;
  accessorFn?: (row: TData) => unknown;
  sortable?: boolean;
  hideable?: boolean;
  filterable?: boolean;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  cell?: (props: { row: Row<TData>; getValue: () => unknown }) => React.ReactNode;
}

// ============================================================================
// EXPORT CONFIG
// ============================================================================

/**
 * Opciones para exportacion a Excel
 */
export interface DataTableExportOptions {
  filename: string;
  sheetName?: string;
  title?: string;
  includeDate?: boolean;
}

/**
 * Configuracion de exportacion a Excel
 */
export interface DataTableExportConfig<TData> {
  fetchAllData: () => Promise<TData[]>;
  options: DataTableExportOptions;
  formatters?: Record<string, (value: unknown, row: TData) => string | number | null>;
  excludeColumns?: string[];
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

/**
 * Props del componente DataTable principal.
 *
 * MODO CLIENT-SIDE: omitir totalRows y searchParams.
 * MODO SERVER-SIDE: pasar totalRows y searchParams.
 *
 * NUEVAS PROPS vs BaseERP (adaptadas de s-codeControl actual):
 * - onRowClick: click en fila para navegar
 * - rowClassName: clases condicionales por fila
 */
export interface DataTableProps<TData, TValue = unknown> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];

  // --- Server-side mode (ambos opcionales para soportar client-side) ---
  totalRows?: number;
  searchParams?: DataTableSearchParams;

  // --- Filtros ---
  facetedFilters?: DataTableFacetedFilterConfig[];
  searchPlaceholder?: string;
  searchColumn?: string;
  showSearch?: boolean;

  // --- Columnas ---
  showColumnToggle?: boolean;
  initialColumnVisibility?: Record<string, boolean>;

  // --- Seleccion de filas ---
  showRowSelection?: boolean;
  enableRowSelection?: boolean;
  onRowSelectionChange?: (selectedRows: TData[]) => void;

  // --- Row interaction (NUEVO vs BaseERP) ---
  onRowClick?: (row: TData) => void;
  rowClassName?: string | ((row: TData) => string);

  // --- Paginacion ---
  emptyMessage?: string;
  pageSizeOptions?: number[];

  // --- Toolbar ---
  toolbarActions?: React.ReactNode;
  exportConfig?: DataTableExportConfig<TData>;
  showExportButton?: boolean;

  // --- Persistencia ---
  tableId?: string;
  showFilterToggle?: boolean;
  initialFilterVisibility?: Record<string, boolean>;

  // --- Testing ---
  'data-testid'?: string;
}

/**
 * Props del DataTableToolbar
 */
export interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchPlaceholder?: string;
  searchColumn?: string;
  facetedFilters?: DataTableFacetedFilterConfig[];
  showColumnToggle?: boolean;
  toolbarActions?: React.ReactNode;
  exportActions?: React.ReactNode;
  showSearch?: boolean;
  tableId?: string;
  showFilterToggle?: boolean;
  filterVisibility?: Record<string, boolean>;
  onFilterVisibilityChange?: (visibility: Record<string, boolean>) => void;
}

/**
 * Props del DataTablePagination
 */
export interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  totalRows: number;
  pageSizeOptions?: number[];
  showRowSelection?: boolean;
}

/**
 * Props del DataTableColumnHeader
 */
export interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

/**
 * Props del DataTableFacetedFilter
 */
export interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title: string;
  options: DataTableFilterOption[];
  externalCounts?: Map<string, number>;
}

/**
 * Props del DataTableDateRangeFilter.
 * Adaptacion: usa date-fns en lugar de moment.
 */
export interface DataTableDateRangeFilterProps {
  columnId: string;
  title: string;
}

/**
 * Props del DataTableTextFilter
 */
export interface DataTableTextFilterProps {
  columnId: string;
  title: string;
  placeholder?: string;
}

/**
 * Props del DataTableFilterOptions
 */
export interface DataTableFilterOptionsProps {
  filters: DataTableFacetedFilterConfig[];
  filterVisibility: Record<string, boolean>;
  onFilterVisibilityChange: (visibility: Record<string, boolean>) => void;
  tableId: string;
}

/**
 * Props del DataTableViewOptions
 */
export interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}

/**
 * Props del _DataTableExportButton (componente interno)
 */
export interface DataTableExportButtonProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  exportConfig: DataTableExportConfig<TData>;
}

// ============================================================================
// SERVER ACTION TYPES (para Supabase queries)
// ============================================================================

/**
 * Parametros para server actions de paginacion.
 */
export interface DataTableQueryParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, string[]>;
}

/**
 * Respuesta de server actions con paginacion
 */
export interface DataTableQueryResult<TData> {
  data: TData[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

// ============================================================================
// PRISMA HELPERS (compatibilidad)
// ============================================================================

export interface PrismaTableParams {
  skip: number;
  take: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
  where?: Record<string, unknown>;
}

// ============================================================================
// SUPABASE QUERY HELPERS
// ============================================================================

/**
 * Parametros generados por stateToPaginationParams.
 * Funciona con Prisma findMany y con Supabase .range().
 */
export interface TablePaginationParams {
  skip: number;
  take: number;
  orderBy?: { field: string; direction: 'asc' | 'desc' };
}

// ============================================================================
// TABLE PREFERENCES
// ============================================================================

/**
 * Preferencias guardadas de una tabla
 */
export interface TablePreferences {
  columnVisibility?: Record<string, boolean>;
  filterVisibility?: Record<string, boolean>;
}
