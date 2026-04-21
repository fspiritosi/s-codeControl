'use client';

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

import type { DataTablePaginationProps } from './types';

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];

/**
 * Controles de paginación para el DataTable
 *
 * @example
 * ```tsx
 * <DataTablePagination
 *   table={table}
 *   totalRows={100}
 *   pageSizeOptions={[10, 20, 50]}
 * />
 * ```
 */
export function DataTablePagination<TData>({
  table,
  totalRows,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  showRowSelection = false,
}: DataTablePaginationProps<TData>) {
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const pageCount = table.getPageCount();

  // Calcular rango de filas mostradas
  const startRow = pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div className="flex items-center justify-between px-2">
      {/* Información de selección o rango */}
      <div className="flex-1 text-sm text-muted-foreground">
        {showRowSelection ? (
          <>
            {table.getFilteredSelectedRowModel().rows.length} de{' '}
            {table.getFilteredRowModel().rows.length} fila(s) seleccionada(s).
          </>
        ) : (
          <>
            Mostrando {startRow} a {endRow} de {totalRows} registros
          </>
        )}
      </div>

      <div className="flex items-center space-x-6 lg:space-x-8">
        {/* Selector de filas por página */}
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Filas por página</p>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]" data-testid="page-size-select">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Indicador de página actual */}
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Página {pageIndex + 1} de {pageCount || 1}
        </div>

        {/* Botones de navegación */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            data-testid="pagination-first"
          >
            <span className="sr-only">Ir a primera página</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            data-testid="pagination-prev"
          >
            <span className="sr-only">Ir a página anterior</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            data-testid="pagination-next"
          >
            <span className="sr-only">Ir a página siguiente</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!table.getCanNextPage()}
            data-testid="pagination-last"
          >
            <span className="sr-only">Ir a última página</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
