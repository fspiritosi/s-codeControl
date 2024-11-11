'use client';
import { DataTableViewOptions } from '@/components/CheckList/tables/data-table-view-options';
import { Button } from '@/components/ui/button';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { LampDesk } from 'lucide-react';
import { DataTableFacetedFilterDiagramDetail } from './data-table-faceted-diagramDetail';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbarDiagramDetail<TData>({ table }: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const getUniqueValues = (columnId: string) => {
    return table.getColumn(columnId)?.getFacetedUniqueValues()
      ? Array.from(
          new Set(
            Array.from((table.getColumn(columnId)?.getFacetedUniqueValues() as any)?.keys()).map((item: any) => item)
          )
        )
      : [];
  };

  const uniqueshort_description = getUniqueValues('Descripción');
  const uniqueEstado = getUniqueValues('Estado');

  const createOptions = (uniqueValues: string[], icon: any) => {
    return uniqueValues.map((value) => ({
      label: value,
      value: value,
      icon: icon,
    }));
  };

  const short_descriptionOptions = createOptions(uniqueshort_description, LampDesk);
  const EstadoOptions = createOptions(uniqueEstado, LampDesk);

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {table.getColumn('Descripción') && (
          <DataTableFacetedFilterDiagramDetail
            column={table.getColumn('Descripción')}
            title="Descripcion"
            options={short_descriptionOptions}
          />
        )}
        {table.getColumn('Estado') && (
          <DataTableFacetedFilterDiagramDetail
            column={table.getColumn('Estado')}
            title="Estado"
            options={EstadoOptions}
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
