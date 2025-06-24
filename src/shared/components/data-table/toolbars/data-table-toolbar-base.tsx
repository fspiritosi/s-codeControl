'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import { PermanentDocumentsDownloadButton } from '@/features/Employees/Empleados/DocumentosEmpleados/PermanentDocumentsDownloadButton';
import { Table } from '@tanstack/react-table';
import { X } from 'lucide-react';
import * as React from 'react';
import { BulkActionProps } from '../base/data-table';
import { DataTableExportExcel } from '../base/data-table-export-excel';
import { DataTableFilterOptions } from '../base/data-table-filter-options';
import { DataTableViewOptions } from '../base/data-table-view-options';
import { DataTableDatePicker } from '../filters/data-table-date-picker';
import { DataTableFacetedFilter } from '../filters/data-table-faceted-filter';

interface FilterableColumn<TData> {
  columnId: string;
  title: string;
  options?: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
  // NUEVO: soporte para filtro de rango de fechas
  type?: 'date-range';
  showFrom?: boolean; // mostrar DatePicker Desde
  showTo?: boolean; // mostrar DatePicker Hasta
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

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  filterableColumns?: FilterableColumn<TData>[];
  searchableColumns?: SearchableColumn[];
  showViewOptions?: boolean;
  showFilterOptions?: boolean; // Opción para mostrar selector de filtros
  initialVisibleFilters?: string[]; // Filtros inicialmente visibles
  extraActions?: React.ReactNode | ((table: Table<TData>) => React.ReactNode);
  showExport?: boolean;
  showDocumentDownload?: boolean;
  tableId?: string; // Añadimos tableId para persistencia
  bulkAction?: BulkActionProps<TData>;
}

export function DataTableToolbarBase<TData>({
  table,
  filterableColumns = [],
  searchableColumns = [],
  showViewOptions = true,
  showFilterOptions = true,
  initialVisibleFilters,
  extraActions,
  showExport = true,
  showDocumentDownload = false,
  tableId, // Recibimos tableId
  bulkAction,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const columnVisibility = table.getState().columnVisibility;

  // Estado para controlar qué filtros son visibles
  const [visibleFilters, setVisibleFilters] = React.useState<string[]>(initialVisibleFilters || []);

  console.log(initialVisibleFilters);

  // NUEVO: Estado para los filtros de rango de fechas por columna
  const [dateFilters, setDateFilters] = React.useState<{ [columnId: string]: { from: Date | null; to: Date | null } }>(
    () => {
      // Inicializar con los valores por defecto de las columnas
      const initialFilters: { [columnId: string]: { from: Date | null; to: Date | null } } = {};

      filterableColumns.forEach((column) => {
        if (column.type === 'date-range' && column.defaultValues) {
          initialFilters[column.columnId] = {
            from: column.defaultValues.from,
            to: column.defaultValues.to,
          };

          // Aplicar el filtro inicial a la columna correspondiente
          const tableColumn = table.getColumn(column.columnId);
          if (tableColumn) {
            setTimeout(() => {
              tableColumn.setFilterValue(column.defaultValues);
            }, 0);
          }
        }
      });

      return initialFilters;
    }
  );

  // Importa tu DatePicker aquí (ajusta el import según tu proyecto)
  // import DatePicker from '@/components/DatePicker';
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelectedRows = selectedRows.length > 0;
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center gap-2 flex-wrap">
        {bulkAction?.enabled && hasSelectedRows && (
          <Button
            variant="default"
            size="sm"
            className="h-8 gap-1"
            onClick={() => {
              const selectedData = selectedRows.map((row) => row.original);
              bulkAction.onClick(selectedData);
            }}
          >
            {bulkAction.icon}
            {bulkAction.label || `Acción (${selectedRows.length})`}
          </Button>
        )}
        {searchableColumns.length > 0 &&
          searchableColumns.map((column) => {
            const tableColumn = table.getColumn(column.columnId);
            // Solo mostrar el campo de búsqueda si la columna está visible
            return tableColumn && columnVisibility[column.columnId] !== false ? (
              <Input
                key={column.columnId}
                placeholder={column.placeholder || `Buscar...`}
                value={(tableColumn.getFilterValue() as string) ?? ''}
                onChange={(event) => tableColumn.setFilterValue(event.target.value)}
                className="h-8 w-[150px] lg:w-[250px]"
              />
            ) : null;
          })}

        {/* No mostrar ningún filtro si visibleFilters está vacío */}
        {filterableColumns.length > 0 &&
          visibleFilters.length > 0 &&
          filterableColumns
            .filter((column) => visibleFilters.includes(column.columnId))
            .map((column) => {
              const tableColumn = table.getColumn(column.columnId);
              // Soporte para filtro de rango de fechas
              if (column.type === 'date-range') {
                const current = dateFilters[column.columnId] || { from: null, to: null };
                return (
                  <div key={column.columnId} className="flex items-center space-x-2">
                    {column.showFrom !== false && (
                      <DataTableDatePicker
                        date={current.from}
                        setDate={(date: Date | null) => {
                          const newFilter = { ...current, from: date };
                          setDateFilters((prev) => ({ ...prev, [column.columnId]: newFilter }));
                          tableColumn?.setFilterValue(newFilter);
                        }}
                        label={column.fromPlaceholder || 'Desde'}
                        clearFilter={() => {
                          const newFilter = { ...current, from: null };
                          setDateFilters((prev) => ({ ...prev, [column.columnId]: newFilter }));
                          if (!newFilter.from && !newFilter.to) {
                            tableColumn?.setFilterValue(undefined);
                          } else {
                            tableColumn?.setFilterValue(newFilter);
                          }
                        }}
                      />
                    )}
                    {column.showTo !== false && (
                      <DataTableDatePicker
                        date={current.to}
                        setDate={(date: Date | null) => {
                          const newFilter = { ...current, to: date };
                          setDateFilters((prev) => ({ ...prev, [column.columnId]: newFilter }));
                          tableColumn?.setFilterValue(newFilter);
                        }}
                        label={column.toPlaceholder || 'Hasta'}
                        clearFilter={() => {
                          const newFilter = { ...current, to: null };
                          setDateFilters((prev) => ({ ...prev, [column.columnId]: newFilter }));
                          if (!newFilter.from && !newFilter.to) {
                            tableColumn?.setFilterValue(undefined);
                          } else {
                            tableColumn?.setFilterValue(newFilter);
                          }
                        }}
                      />
                    )}
                  </div>
                );
              }
              // Filtro tradicional (facetado)
              // Solo mostrar el filtro si la columna está visible
              return tableColumn && columnVisibility[column.columnId] !== false ? (
                <DataTableFacetedFilter
                  key={column.columnId}
                  column={tableColumn}
                  title={column.title}
                  options={column.options || []}
                />
              ) : null;
            })}

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters();
              setDateFilters({}); // Limpiar los estados locales de los DatePickers
            }}
            className="h-8 px-2 lg:px-3"
          >
            Limpiar filtros
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center space-x-2 flex-wrap">
        {typeof extraActions === 'function' ? extraActions(table) : extraActions}
        {/* {showDocumentDownload && <PermanentDocumentsDownloadButton table={table} />} */}
        {showExport && <DataTableExportExcel table={table} />}
        {showFilterOptions && filterableColumns.length > 0 && (
          <DataTableFilterOptions
            filterableColumns={filterableColumns}
            visibleFilters={visibleFilters}
            onVisibilityChange={setVisibleFilters}
            tableId={tableId}
            columnVisibility={columnVisibility}
          />
        )}
        {showViewOptions && <DataTableViewOptions table={table} tableId={tableId} />}
      </div>
    </div>
  );
}
