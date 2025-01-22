'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';

import { frecuencias } from './data';
import { DataTableFacetedFilter } from './data-table-faceted-filter';
import { DataTableViewOptions } from './data-table-view-options';
import { DataTableAnswersFacetedFilter } from './data-table-answers-filters';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({ table }: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const uniqueFrequencies = table.getColumn('Frecuencia')?.getFacetedUniqueValues()
    ? Array.from(
        new Set(
          Array?.from((table.getColumn('Frecuencia')?.getFacetedUniqueValues() as any)?.keys()).map((item: any) => item)
        )
      )
    : [];
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filtrar por nombre o descripción"
          value={(table.getColumn('Titulo')?.getFilterValue() as string) ?? ''}
          onChange={(event) => {
            table.getColumn('Titulo')?.setFilterValue(event.target.value);
          }}
          className="h-8 w-[250px] lg:w-[350px]"
        />

        {table.getColumn('Frecuencia') && (
          <DataTableAnswersFacetedFilter
            column={table.getColumn('Frecuencia')}
            title="Frecuencia"
            options={frecuencias.filter((frecuencia) => uniqueFrequencies.includes(frecuencia.label))}
          />
        )}
        {isFiltered && (
          <Button variant="ghost" onClick={() => table.resetColumnFilters()} className="h-8 px-2 lg:px-3">
            Limpiar filtros
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
