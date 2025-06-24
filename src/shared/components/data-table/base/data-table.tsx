'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import * as React from 'react';
import { DataTableToolbarBase } from '../toolbars/data-table-toolbar-base';
import { DataTablePagination } from './data-table-pagination';

// Tipos para el toolbar
interface FilterableColumn<TData> {
  columnId: string;
  title: string;
  options?: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
  // Soporte para filtros de rango de fechas
  type?: 'date-range';
  showFrom?: boolean;
  showTo?: boolean;
  fromPlaceholder?: string;
  toPlaceholder?: string;
  // Valores predeterminados para el filtro de fechas
  defaultValues?: {
    from: Date | null;
    to: Date | null;
  };
}

interface SearchableColumn {
  columnId: string;
  placeholder?: string;
}

import { cn } from '@/lib/utils';
import type { Table as TableType, Updater } from '@tanstack/react-table';
export interface BulkActionProps<TData> {
  enabled?: boolean; // Activar/desactivar funcionalidad
  label?: string; // Etiqueta del botón
  icon?: React.ReactNode; // Icono opcional
  onClick: (rows: TData[]) => void; // Función a ejecutar con las filas seleccionadas
}

interface ToolbarOptions<TData> {
  filterableColumns?: FilterableColumn<TData>[];
  searchableColumns?: SearchableColumn[];
  showViewOptions?: boolean;
  showFilterOptions?: boolean; // Nueva opción para mostrar el selector de filtros
  initialVisibleFilters: string[]; // Filtros inicialmente visibles
  extraActions?: React.ReactNode | ((table: TableType<TData>) => React.ReactNode);
  bulkAction?: BulkActionProps<TData>;
  showDocumentDownload?: boolean;
  showExport?: boolean;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (row: TData) => void;
  toolbarOptions?: ToolbarOptions<TData>;
  paginationComponent?: React.ReactNode;
  className?: string;
  tableId?: string; // ID para persistencia
  initialColumnVisibility?: VisibilityState; // Estado inicial de columnas
  savedVisibility: VisibilityState;
  row_classname?: (row: TData) => string | string;
  bulkAction?: BulkActionProps<TData>;
  onColumnFiltersChange?: (filters: Updater<ColumnFiltersState>) => void;
}

export function BaseDataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
  toolbarOptions,
  paginationComponent,
  className = '',
  tableId,
  savedVisibility,
  row_classname,
  onColumnFiltersChange,
}: DataTableProps<TData, TValue>) {
  // Intentar cargar la visibilidad guardada antes del renderizado inicial si hay tableId
  // const savedVisibility = savedColumns

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Usar la visibilidad guardada, o la inicial si se proporciona, o un objeto vacío
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(savedVisibility || {});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    // En BaseDataTable.tsx, modificar la llamada al callback:
    onColumnFiltersChange: (updater) => {
      const newFilters = typeof updater === 'function' ? updater(columnFilters) : updater;
      setColumnFilters(newFilters);

      // Llamar al callback si existe, pasando el valor final, no el updater
      if (onColumnFiltersChange) {
        onColumnFiltersChange(newFilters);
      }
    },
    onColumnVisibilityChange: (visibility) => {
      setColumnVisibility(visibility);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className={`space-y-4 ${className} w-full grid grid-cols-1`}>
      {toolbarOptions && (
        <DataTableToolbarBase
          table={table}
          showExport={toolbarOptions.showExport}
          showDocumentDownload={toolbarOptions.showDocumentDownload}
          filterableColumns={toolbarOptions.filterableColumns}
          searchableColumns={toolbarOptions.searchableColumns}
          initialVisibleFilters={toolbarOptions.initialVisibleFilters}
          showViewOptions={toolbarOptions.showViewOptions}
          bulkAction={toolbarOptions.bulkAction}
          extraActions={
            typeof toolbarOptions.extraActions === 'function'
              ? toolbarOptions.extraActions(table)
              : toolbarOptions.extraActions
          }
          tableId={tableId}
        />
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table?.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  className={
                    typeof row_classname === 'string'
                      ? cn(row_classname, onRowClick && 'hover:cursor-pointer')
                      : row_classname
                        ? row_classname(row.original)
                        : onRowClick
                          ? 'hover:cursor-pointer'
                          : ''
                  }
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  onClick={() => onRowClick && onRowClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Sin resultados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {paginationComponent ? (
        React.cloneElement(paginationComponent as React.ReactElement, { table })
      ) : (
        <DataTablePagination table={table} />
      )}
    </div>
  );
}
