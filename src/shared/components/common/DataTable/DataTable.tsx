'use client';

import * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  useReactTable,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { saveTableColumnVisibility } from '@/shared/actions/table-preferences';

import { _DataTableExportButton } from './_DataTableExportButton';
import { DataTablePagination } from './DataTablePagination';
import { DataTableToolbar } from './DataTableToolbar';
import { useDataTable } from './useDataTable';
import type { DataTableProps } from './types';

/**
 * DataTable Server-Side con soporte para paginación, sorting y filtros
 *
 * Este componente está diseñado para trabajar con datos paginados desde el servidor.
 * El estado se sincroniza automáticamente con la URL para permitir compartir links
 * y navegación con el botón atrás/adelante del navegador.
 *
 * @example
 * ```tsx
 * // 1. Server Component (page.tsx)
 * export default async function EmployeesPage({ searchParams }) {
 *   const params = await searchParams;
 *   const { data, total } = await getEmployees(params);
 *
 *   return (
 *     <DataTable
 *       columns={columns}
 *       data={data}
 *       totalRows={total}
 *       searchParams={params}
 *       searchPlaceholder="Buscar empleados..."
 *       tableId="employees-list"
 *       showFilterToggle={true}
 *       facetedFilters={[
 *         { columnId: 'status', title: 'Estado', options: statusOptions },
 *         { columnId: 'createdAt', title: 'Fecha', type: 'dateRange' },
 *       ]}
 *     />
 *   );
 * }
 *
 * // 2. Server Action
 * export async function getEmployees(searchParams: DataTableSearchParams) {
 *   const state = parseSearchParams(searchParams);
 *   const prismaParams = stateToPrismaParams(state);
 *
 *   const [data, total] = await Promise.all([
 *     prisma.employee.findMany({ ...prismaParams, where: { companyId } }),
 *     prisma.employee.count({ where: { companyId } }),
 *   ]);
 *
 *   return { data, total };
 * }
 * ```
 */
export function DataTable<TData extends Record<string, unknown>, TValue = unknown>({
  columns,
  data,
  totalRows,
  searchParams = {},
  facetedFilters = [],
  searchPlaceholder = 'Buscar...',
  searchColumn,
  showColumnToggle = true,
  showRowSelection = false,
  enableRowSelection = false,
  onRowSelectionChange,
  emptyMessage = 'No se encontraron resultados.',
  pageSizeOptions,
  toolbarActions,
  exportConfig,
  showExportButton = true,
  showSearch = false,
  initialColumnVisibility = {},
  tableId,
  showFilterToggle = false,
  initialFilterVisibility = {},
  'data-testid': dataTestId = 'data-table',
}: DataTableProps<TData, TValue>) {
  // Estado de selección de filas (local)
  const [rowSelection, setRowSelection] = React.useState({});

  // Estado de visibilidad de columnas (local, inicializado con las visibilidades por defecto)
  const [columnVisibility, setColumnVisibility] = React.useState(initialColumnVisibility);

  // Estado de visibilidad de filtros
  const [filterVisibility, setFilterVisibility] = React.useState<Record<string, boolean>>(
    initialFilterVisibility
  );

  // Hook para manejar estado sincronizado con URL
  const filterableColumns = facetedFilters.map((f) => f.columnId);
  const {
    pagination,
    sorting,
    columnFilters,
    onPaginationChange,
    onSortingChange,
    onColumnFiltersChange,
  } = useDataTable({
    filterableColumns,
  });

  // Calcular pageCount basado en totalRows
  const pageCount = Math.ceil(totalRows / pagination.pageSize);

  // Configurar tabla con TanStack Table
  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    // Row selection
    enableRowSelection,
    onRowSelectionChange: (updater) => {
      const newSelection =
        typeof updater === 'function' ? updater(rowSelection) : updater;
      setRowSelection(newSelection);

      // Callback externo con las filas seleccionadas
      if (onRowSelectionChange) {
        const selectedRows = Object.keys(newSelection)
          .filter((key) => newSelection[key as keyof typeof newSelection])
          .map((index) => data[Number(index)]);
        onRowSelectionChange(selectedRows);
      }
    },
    // Column visibility (local)
    onColumnVisibilityChange: setColumnVisibility,
    // Server-side pagination
    manualPagination: true,
    onPaginationChange,
    // Server-side sorting
    manualSorting: true,
    onSortingChange,
    // Server-side filtering
    manualFiltering: true,
    onColumnFiltersChange,
    // Row models
    getCoreRowModel: getCoreRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  // Persistir visibilidad de columnas con debounce de 1 segundo
  React.useEffect(() => {
    if (!tableId) return;

    const timer = setTimeout(() => {
      saveTableColumnVisibility(tableId, columnVisibility);
    }, 1000);

    return () => clearTimeout(timer);
  }, [columnVisibility, tableId]);

  return (
    <div className="space-y-4" data-testid={dataTestId}>
      {/* Toolbar */}
      <DataTableToolbar
        table={table}
        searchPlaceholder={searchPlaceholder}
        searchColumn={searchColumn}
        facetedFilters={facetedFilters}
        showColumnToggle={showColumnToggle}
        tableId={tableId}
        showFilterToggle={showFilterToggle}
        filterVisibility={filterVisibility}
        onFilterVisibilityChange={setFilterVisibility}
        exportActions={
          exportConfig && showExportButton ? (
            <_DataTableExportButton columns={columns} exportConfig={exportConfig} />
          ) : undefined
        }
        toolbarActions={toolbarActions}
        showSearch={showSearch}
      />

      {/* Table */}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  data-testid={`table-row-${row.id}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination
        table={table}
        totalRows={totalRows}
        pageSizeOptions={pageSizeOptions}
        showRowSelection={showRowSelection && enableRowSelection}
      />
    </div>
  );
}
