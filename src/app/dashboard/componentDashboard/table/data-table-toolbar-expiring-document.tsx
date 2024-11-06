'use client';

import { DataTableViewOptions } from '@/components/CheckList/tables/data-table-view-options';
import { Button } from '@/components/ui/button';
import { Cross2Icon, PersonIcon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { DataTableFacetedFilterExpirinDocuments } from './data-table-faceted-expiring-document-filter';
import { Truck } from 'lucide-react';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbarExpiringDocument<TData>({ table }: DataTableToolbarProps<TData>) {
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

  const uniqueEmpleados = getUniqueValues('Empleados');
  const uniqueDocumentos = getUniqueValues('Documentos');
  const uniqueEquipment = getUniqueValues('Equipment');

  const createOptions = (uniqueValues: string[], icon: any) => {
    return uniqueValues.map((value) => ({
      label: value,
      value: value,
      icon: icon,
    }));
  };

  const EmpleadosOptions = createOptions(uniqueEmpleados, PersonIcon);
  const EquipmentOptions = createOptions(uniqueEquipment, Truck);
  const DocumentosOptions = createOptions(uniqueDocumentos, PersonIcon);

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {table.getColumn('Empleados') && (
          <DataTableFacetedFilterExpirinDocuments
            column={table.getColumn('Empleados')}
            title="Empleados"
            options={EmpleadosOptions}
          />
        )}
        {table.getColumn('Equipment') && (
          <DataTableFacetedFilterExpirinDocuments
            column={table.getColumn('Equipment')}
            title="Equipos"
            options={EquipmentOptions}
          />
        )}
        {table.getColumn('Documentos') && (
          <DataTableFacetedFilterExpirinDocuments
            column={table.getColumn('Documentos')}
            title="Documentos"
            options={DocumentosOptions}
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
