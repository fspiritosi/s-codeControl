'use client';

import * as React from 'react';
import type { ColumnDef, ColumnFiltersState, PaginationState, Row, SortingState } from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { cn } from '@/shared/lib/utils';
import { EmptyState } from '@/shared/components/common/EmptyState';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';

import { saveTableColumnVisibility } from './table-preferences';
import { DataTableExportButton } from './DataTableExportButton';
import { DataTablePagination } from './DataTablePagination';
import { DataTableToolbar } from './DataTableToolbar';
import { useDataTable } from './useDataTable';
import type { DataTableProps } from './types';

// ============================================================================
// Internal: Shared table body rendering
// ============================================================================

interface DataTableBodyProps<TData, TValue = unknown> {
  table: ReturnType<typeof useReactTable<TData>>;
  columns: ColumnDef<TData, TValue>[];
  emptyMessage: string;
  onRowClick?: (row: TData) => void;
  rowClassName?: string | ((row: TData) => string);
}

function DataTableBody<TData, TValue = unknown>({
  table,
  columns,
  emptyMessage,
  onRowClick,
  rowClassName,
}: DataTableBodyProps<TData, TValue>) {
  return (
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
                className={cn(
                  typeof rowClassName === 'function'
                    ? rowClassName(row.original)
                    : rowClassName,
                  onRowClick && 'hover:cursor-pointer'
                )}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
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
              >
                <EmptyState title={emptyMessage} />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// ============================================================================
// Internal: Server-side DataTable
// ============================================================================

function DataTableServerSide<TData extends Record<string, unknown>, TValue = unknown>({
  columns,
  data,
  totalRows,
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
  showSearch = false,
  initialColumnVisibility = {},
  tableId,
  showFilterToggle = false,
  initialFilterVisibility = {},
  onRowClick,
  rowClassName,
  exportConfig,
  showExportButton = true,
  'data-testid': dataTestId = 'data-table',
}: DataTableProps<TData, TValue> & { totalRows: number }) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState(initialColumnVisibility);
  const [filterVisibility, setFilterVisibility] = React.useState<Record<string, boolean>>(
    initialFilterVisibility
  );

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

  const pageCount = Math.ceil(totalRows / pagination.pageSize);

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
    enableRowSelection,
    onRowSelectionChange: (updater) => {
      const newSelection =
        typeof updater === 'function' ? updater(rowSelection) : updater;
      setRowSelection(newSelection);

      if (onRowSelectionChange) {
        const selectedRows = Object.keys(newSelection)
          .filter((key) => newSelection[key as keyof typeof newSelection])
          .map((index) => data[Number(index)]);
        onRowSelectionChange(selectedRows);
      }
    },
    onColumnVisibilityChange: setColumnVisibility,
    manualPagination: true,
    onPaginationChange,
    manualSorting: true,
    onSortingChange,
    manualFiltering: true,
    onColumnFiltersChange,
    getCoreRowModel: getCoreRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  // Persist column visibility with debounce
  React.useEffect(() => {
    if (!tableId) return;

    const timer = setTimeout(() => {
      saveTableColumnVisibility(tableId, columnVisibility);
    }, 1000);

    return () => clearTimeout(timer);
  }, [columnVisibility, tableId]);

  // Boton de export a Excel (solo si hay exportConfig)
  const exportActions = exportConfig && showExportButton ? (
    <DataTableExportButton columns={columns as ColumnDef<TData, unknown>[]} exportConfig={exportConfig} />
  ) : undefined;

  return (
    <div className="space-y-4" data-testid={dataTestId}>
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
        toolbarActions={toolbarActions}
        exportActions={exportActions}
        showSearch={showSearch}
      />

      <DataTableBody
        table={table}
        columns={columns}
        emptyMessage={emptyMessage}
        onRowClick={onRowClick}
        rowClassName={rowClassName}
      />

      {totalRows > 0 && (
        <DataTablePagination
          table={table}
          totalRows={totalRows}
          pageSizeOptions={pageSizeOptions}
          showRowSelection={showRowSelection && enableRowSelection}
        />
      )}
    </div>
  );
}

// ============================================================================
// Internal: Client-side DataTable
// ============================================================================

function DataTableClientSide<TData extends Record<string, unknown>, TValue = unknown>({
  columns,
  data,
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
  showSearch = false,
  initialColumnVisibility = {},
  initialColumnFilters,
  tableId,
  showFilterToggle = false,
  initialFilterVisibility = {},
  onRowClick,
  rowClassName,
  exportConfig,
  showExportButton = true,
  'data-testid': dataTestId = 'data-table',
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState(initialColumnVisibility);
  const [filterVisibility, setFilterVisibility] = React.useState<Record<string, boolean>>(
    initialFilterVisibility
  );
  const [clientPagination, setClientPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [clientSorting, setClientSorting] = React.useState<SortingState>([]);
  const [clientColumnFilters, setClientColumnFilters] = React.useState<ColumnFiltersState>(
    initialColumnFilters ?? []
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: clientSorting,
      columnVisibility,
      rowSelection,
      columnFilters: clientColumnFilters,
      pagination: clientPagination,
    },
    enableRowSelection,
    onRowSelectionChange: (updater) => {
      const newSelection =
        typeof updater === 'function' ? updater(rowSelection) : updater;
      setRowSelection(newSelection);

      if (onRowSelectionChange) {
        const selectedRows = Object.keys(newSelection)
          .filter((key) => newSelection[key as keyof typeof newSelection])
          .map((index) => data[Number(index)]);
        onRowSelectionChange(selectedRows);
      }
    },
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setClientPagination,
    onSortingChange: setClientSorting,
    onColumnFiltersChange: setClientColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  // Persist column visibility with debounce
  React.useEffect(() => {
    if (!tableId) return;

    const timer = setTimeout(() => {
      saveTableColumnVisibility(tableId, columnVisibility);
    }, 1000);

    return () => clearTimeout(timer);
  }, [columnVisibility, tableId]);

  const totalRows = table.getFilteredRowModel().rows.length;

  // Boton de export a Excel (solo si hay exportConfig)
  const exportActions = exportConfig && showExportButton ? (
    <DataTableExportButton columns={columns as ColumnDef<TData, unknown>[]} exportConfig={exportConfig} />
  ) : undefined;

  return (
    <div className="space-y-4" data-testid={dataTestId}>
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
        toolbarActions={toolbarActions}
        exportActions={exportActions}
        showSearch={showSearch}
      />

      <DataTableBody
        table={table}
        columns={columns}
        emptyMessage={emptyMessage}
        onRowClick={onRowClick}
        rowClassName={rowClassName}
      />

      {totalRows > 0 && (
        <DataTablePagination
          table={table}
          totalRows={totalRows}
          pageSizeOptions={pageSizeOptions}
          showRowSelection={showRowSelection && enableRowSelection}
        />
      )}
    </div>
  );
}

// ============================================================================
// Public: DataTable (auto-detects client-side vs server-side)
// ============================================================================

/**
 * DataTable con soporte dual client-side y server-side.
 *
 * MODO CLIENT-SIDE: omitir totalRows. Paginacion, sorting y filtrado en cliente.
 * MODO SERVER-SIDE: pasar totalRows. Estado sincronizado con URL.
 */
export function DataTable<TData extends Record<string, unknown>, TValue = unknown>(
  props: DataTableProps<TData, TValue>
) {
  const isServerSide = props.totalRows !== undefined;

  if (isServerSide) {
    return <DataTableServerSide {...props} totalRows={props.totalRows!} />;
  }

  return <DataTableClientSide {...props} />;
}
