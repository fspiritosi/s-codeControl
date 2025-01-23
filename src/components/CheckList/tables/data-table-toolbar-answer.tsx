'use client';

import { Button } from '@/components/ui/button';
import { Cross2Icon, PersonIcon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';

import { DataTableFacetedFilter } from './data-table-faceted-filter';
import { DataTableViewOptions } from './data-table-view-options';
import { DataTableAnswersFacetedFilter } from './data-table-answers-filters';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbarAnswer<TData>({ table }: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const uniqueChofer = table.getColumn('Chofer')?.getFacetedUniqueValues()
    ? Array.from(
        new Set(
          Array?.from((table.getColumn('Chofer')?.getFacetedUniqueValues() as any)?.keys()).map((item: any) => item)
        )
      )
    : [];

  const uniqueDomain = table.getColumn('Dominio')?.getFacetedUniqueValues()
    ? Array.from(
        new Set(
          Array?.from((table.getColumn('Dominio')?.getFacetedUniqueValues() as any)?.keys()).map((item: any) => item)
        )
      )
    : [];

  const domainOptions = uniqueDomain.map((domain) => {
    return {
      label: domain,
      value: domain,
      icon: PersonIcon,
    };
  });

  const choferOptions = uniqueChofer.map((frecuencia) => {
    return {
      label: frecuencia,
      value: frecuencia,
      icon: PersonIcon,
    };
  });

  // console.log('uniqueChofer', uniqueChofer);
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {table.getColumn('Chofer') && (
          <DataTableAnswersFacetedFilter column={table.getColumn('Chofer')} title="Choferes" options={choferOptions} />
        )}
        {table.getColumn('Dominio') && (
          <DataTableAnswersFacetedFilter column={table.getColumn('Dominio')} title="Dominios" options={domainOptions} />
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
