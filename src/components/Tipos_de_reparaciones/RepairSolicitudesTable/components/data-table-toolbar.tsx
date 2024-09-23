'use client';

import { Cross2Icon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { criticidad, statuses } from '../data';
import { DataTableFacetedFilter } from './data-table-faceted-filter';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({ table }: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const equipment = table.getColumn('domain')?.getFacetedUniqueValues();
  const formattedEquipment = equipment
    ? Array.from(equipment.keys()).map((key) => ({
        label: key,
        value: key,
      }))
    : [];
  const titles = table.getColumn('title')?.getFacetedUniqueValues();
  const formattedTitles = titles
    ? Array.from(titles.keys()).map((key) => ({
        label: key,
        value: key,
      }))
    : [];

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filtrar por numero interno..."
          value={(table.getColumn('intern_number')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('intern_number')?.setFilterValue(event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn('state') && (
          <DataTableFacetedFilter column={table.getColumn('state')} title="Estado" options={statuses} />
        )}
        {table.getColumn('title') && (
          <DataTableFacetedFilter column={table.getColumn('title')} title="Titulo" options={formattedTitles} />
        )}
        {table.getColumn('priority') && (
          <DataTableFacetedFilter column={table.getColumn('priority')} title="Criticidad" options={criticidad} />
        )}
        {table.getColumn('domain') && (
          <DataTableFacetedFilter column={table.getColumn('domain')} title="Equipo" options={formattedEquipment} />
        )}
        {isFiltered && (
          <Button variant="ghost" onClick={() => table.resetColumnFilters()} className="h-8 px-2 lg:px-3">
            Limpiar filtros
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      {/* <DataTableViewOptions table={table} /> */}
    </div>
  );
}
