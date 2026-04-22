import type { Column, ColumnDef, Row, Table } from '@tanstack/react-table';
import type { LucideIcon } from 'lucide-react';

// ============================================================================
// SEARCH PARAMS TYPES
// ============================================================================

/**
 * Parámetros de URL para el DataTable server-side
 */
export interface DataTableSearchParams {
  /** Página actual (0-indexed internamente, 1-indexed en URL) */
  page?: string;
  /** Cantidad de filas por página */
  pageSize?: string;
  /** Campo por el cual ordenar */
  sortBy?: string;
  /** Dirección del ordenamiento */
  sortOrder?: 'asc' | 'desc';
  /** Término de búsqueda global */
  search?: string;
  /** Filtros adicionales como query params (ej: status=PENDING&priority=HIGH) */
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
 * Opción de filtro faceteado
 */
export interface DataTableFilterOption {
  /** Valor que se envía al servidor */
  value: string;
  /** Etiqueta visible para el usuario */
  label: string;
  /** Icono opcional */
  icon?: LucideIcon;
  /** Color del badge (para estados) */
  color?: string;
}

/**
 * Configuración de un filtro faceteado
 */
export interface DataTableFacetedFilterConfig {
  /** ID de la columna (debe coincidir con el accessorKey) */
  columnId: string;
  /** Título del filtro */
  title: string;
  /** Tipo de filtro: 'faceted' para multi-select, 'dateRange' para rango de fechas, 'text' para texto libre */
  type?: 'faceted' | 'dateRange' | 'text';
  /** Placeholder para el input de texto (solo para tipo 'text') */
  placeholder?: string;
  /** Opciones disponibles (solo para tipo 'faceted') */
  options?: DataTableFilterOption[];
  /** Contadores externos del servidor (reemplaza el conteo local de facets cuando se proveen) */
  externalCounts?: Map<string, number>;
}

// ============================================================================
// COLUMN TYPES
// ============================================================================

/**
 * Configuración extendida para columnas del DataTable
 */
export interface DataTableColumnConfig<TData> {
  /** ID único de la columna */
  id: string;
  /** Título visible en el header */
  title: string;
  /** Key del objeto de datos (para accessorKey) */
  accessorKey?: keyof TData | string;
  /** Función de acceso personalizada */
  accessorFn?: (row: TData) => unknown;
  /** Si la columna es ordenable (default: true) */
  sortable?: boolean;
  /** Si la columna se puede ocultar (default: true) */
  hideable?: boolean;
  /** Si la columna es filtrable */
  filterable?: boolean;
  /** Ancho fijo de la columna */
  width?: number | string;
  /** Alineación del contenido */
  align?: 'left' | 'center' | 'right';
  /** Renderizado personalizado de la celda */
  cell?: (props: { row: Row<TData>; getValue: () => unknown }) => React.ReactNode;
}

// ============================================================================
// EXPORT CONFIG
// ============================================================================

/**
 * Opciones para exportación a Excel
 */
export interface DataTableExportOptions {
  /** Nombre del archivo (sin extensión) */
  filename: string;
  /** Nombre de la hoja en Excel */
  sheetName?: string;
  /** Título del reporte (se muestra en la primera fila) */
  title?: string;
  /** Incluir fecha de generación (default: true) */
  includeDate?: boolean;
}

/**
 * Configuración de exportación a Excel
 */
export interface DataTableExportConfig<TData> {
  /**
   * Función que obtiene TODOS los datos con los filtros actuales (sin paginación)
   * Esta función se llama cuando el usuario hace clic en "Exportar"
   */
  fetchAllData: () => Promise<TData[]>;
  /**
   * Opciones de exportación
   */
  options: DataTableExportOptions;
  /**
   * Formatters personalizados por key de columna
   * Útil para convertir enums a labels legibles
   * @example { status: (val) => statusLabels[val] }
   */
  formatters?: Record<string, (value: unknown, row: TData) => string | number | null>;
  /**
   * Columnas adicionales a excluir (además de 'select' y 'actions')
   */
  excludeColumns?: string[];
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

/**
 * Props del componente DataTable principal
 */
export interface DataTableProps<TData, TValue = unknown> {
  /** Definiciones de columnas de TanStack Table */
  columns: ColumnDef<TData, TValue>[];
  /** Datos de la página actual */
  data: TData[];
  /** Total de filas en el servidor (para paginación) */
  totalRows: number;
  /** Search params actuales de la URL */
  searchParams?: DataTableSearchParams;
  /** Configuración de filtros faceteados */
  facetedFilters?: DataTableFacetedFilterConfig[];
  /** Placeholder del input de búsqueda */
  searchPlaceholder?: string;
  /** Key del campo donde buscar (default: busca en todos) */
  searchColumn?: string;
  /** Mostrar selector de columnas (default: true) */
  showColumnToggle?: boolean;
  /** Mostrar contador de selección (default: false) */
  showRowSelection?: boolean;
  /** Habilitar selección de filas (default: false) */
  enableRowSelection?: boolean;
  /** Callback cuando cambia la selección */
  onRowSelectionChange?: (selectedRows: TData[]) => void;
  /** Mensaje cuando no hay resultados */
  emptyMessage?: string;
  /** Tamaños de página disponibles */
  pageSizeOptions?: number[];
  /** Componente de acciones para el toolbar */
  toolbarActions?: React.ReactNode;
  /** Configuración de exportación a Excel (si se omite, se oculta el botón) */
  exportConfig?: DataTableExportConfig<TData>;
  /** Mostrar botón de exportar a Excel (default: true si hay exportConfig) */
  showExportButton?: boolean;
  /** Visibilidad inicial de columnas (para ocultar columnas por defecto) */
  initialColumnVisibility?: Record<string, boolean>;
  /** ID único de la tabla para persistir preferencias por usuario */
  tableId?: string;
  /** Mostrar botón para toggle de visibilidad de filtros (default: false) */
  showFilterToggle?: boolean;
  /** Visibilidad inicial de filtros (cargada desde preferencias del servidor) */
  initialFilterVisibility?: Record<string, boolean>;
  /** Mostrar input de búsqueda en el toolbar (default: false) */
  showSearch?: boolean;
  /** ID del test para cypress */
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
  /** Contadores externos del servidor (reemplaza el conteo local de facets) */
  externalCounts?: Map<string, number>;
}

/**
 * Props del DataTableViewOptions
 */
export interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}

// ============================================================================
// SERVER ACTION TYPES
// ============================================================================

/**
 * Parámetros para server actions de paginación
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
 * Respuesta de server actions con paginación
 */
export interface DataTableQueryResult<TData> {
  data: TData[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

// ============================================================================
// PRISMA HELPERS
// ============================================================================

/**
 * Genera los parámetros de Prisma a partir de DataTableQueryParams
 */
export interface PrismaTableParams {
  skip: number;
  take: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
  where?: Record<string, unknown>;
}
