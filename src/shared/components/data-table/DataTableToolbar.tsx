'use client';

import { X } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

import { DataTableDateRangeFilter } from './DataTableDateRangeFilter';
import { DataTableFacetedFilter } from './DataTableFacetedFilter';
import { DataTableFilterOptions } from './DataTableFilterOptions';
import { DataTableTextFilter } from './DataTableTextFilter';
import { DataTableViewOptions } from './DataTableViewOptions';
import type { DataTableToolbarProps } from './types';

/**
 * Barra de herramientas con busqueda, filtros y acciones
 */
export function DataTableToolbar<TData>({
  table,
  searchPlaceholder = 'Buscar...',
  searchColumn,
  facetedFilters = [],
  showColumnToggle = true,
  toolbarActions,
  exportActions,
  showSearch = false,
  tableId,
  showFilterToggle = false,
  filterVisibility = {},
  onFilterVisibilityChange,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const searchValue = searchColumn
    ? (table.getColumn(searchColumn)?.getFilterValue() as string) ?? ''
    : (table.getState().globalFilter as string) ?? '';

  const handleSearchChange = (value: string) => {
    if (searchColumn) {
      table.getColumn(searchColumn)?.setFilterValue(value);
    } else {
      table.setGlobalFilter(value);
    }
  };

  const visibleFilters = facetedFilters.filter(
    (f) => filterVisibility[f.columnId] !== false
  );

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {showSearch && (
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(event) => handleSearchChange(event.target.value)}
            className="h-8 w-[150px] lg:w-[250px]"
            data-testid="search-input"
          />
        )}

        {visibleFilters.map((filter) => {
          if (filter.type === 'dateRange') {
            return (
              <DataTableDateRangeFilter
                key={filter.columnId}
                columnId={filter.columnId}
                title={filter.title}
              />
            );
          }

          if (filter.type === 'text') {
            return (
              <DataTableTextFilter
                key={filter.columnId}
                columnId={filter.columnId}
                title={filter.title}
                placeholder={filter.placeholder}
              />
            );
          }

          const column = table.getColumn(filter.columnId);
          if (!column) return null;

          return (
            <DataTableFacetedFilter
              key={filter.columnId}
              column={column}
              title={filter.title}
              options={filter.options ?? []}
              externalCounts={filter.externalCounts}
            />
          );
        })}

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
            data-testid="clear-filters"
          >
            Limpiar
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {exportActions}

        {showFilterToggle &&
          tableId &&
          facetedFilters.length > 0 &&
          onFilterVisibilityChange && (
            <DataTableFilterOptions
              filters={facetedFilters}
              filterVisibility={filterVisibility}
              onFilterVisibilityChange={onFilterVisibilityChange}
              tableId={tableId}
            />
          )}

        {showColumnToggle && <DataTableViewOptions table={table} />}

        {toolbarActions}
      </div>
    </div>
  );
}
