'use client';

import { DataTableFacetedFilter } from '@/components/DailyReport/tables/data-table-faceted-filter2';
import { DataTableViewOptions } from '@/components/CheckList/tables/data-table-view-options';
import { Customers, Employee, Equipment, Items, Services } from '@/components/DailyReport/DailyReport';
import { Button } from '@/components/ui/button';
import {
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  Cross2Icon,
  FileTextIcon,
  GearIcon,
  PersonIcon,
} from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  customers: Customers[];
  services: Services[];
  items: Items[];
  employees: Employee[];
  equipment: Equipment[];
}

export function DataTableToolbarDailyReport<TData>({
  table,
  customers,
  services,
  items,
  employees,
  equipment,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  // const getUniqueValues = (columnId: string) => {
  //   return table.getColumn(columnId)?.getFacetedUniqueValues()
  //     ? Array.from(
  //         new Set(
  //           Array.from((table.getColumn(columnId)?.getFacetedUniqueValues() as any)?.keys()).map((item: any) => item)
  //         )
  //       )
  //     : [];
  // };
  
  
  const getUniqueValues = (columnId: string) => {
    
    const values = table.getColumn(columnId)?.getFacetedUniqueValues()
      ? Array.from(
          new Set(
            // Aplanar el array y obtener los valores únicos, incluyendo vacíos
            Array.from((table.getColumn(columnId)?.getFacetedUniqueValues() as any)?.keys()) // Aplanar arrays anidados
              .map((item: any) => {
    
                // Convertir claves vacías en 'sin completar'
                if (Array.isArray(item) && item.length === 0) {
    
                  return null;
                }
                // Manejar claves combinadas separadas por coma
                // if (typeof item === 'string' && item.includes(':')) {
                //   return item.split(',').map(k => k.trim() === '' ? 'sin completar' : k.trim());
                // }
                return item;
              })
             .flat() // Aplanar nuevamente después de dividir claves combinadas
          )
        )
      : [];
  
    return values;
  };

  

  

  const uniqueClient = getUniqueValues('Cliente');
  const uniqueItem = getUniqueValues('Item');
  const uniqueServices = getUniqueValues('Servicios');
  const uniqueEmployees = getUniqueValues('Empleados');
  const uniqueEquipment = getUniqueValues('Equipos');
  const uniqueWorkingDay = getUniqueValues('Jornada');
  const uniqueStatus = getUniqueValues('Estado');
 
  const createOptions = (uniqueValues: string[], icon: any) => {
    return uniqueValues.map((value) => ({
      label: value,
      value: value,
      icon: icon,
    }));
  };

  const clientOptions = createOptions(uniqueClient, PersonIcon);
  const itemOptions = createOptions(uniqueItem, GearIcon);
  const servicesOptions = createOptions(uniqueServices, FileTextIcon);
  const employeesOptions = createOptions(uniqueEmployees, PersonIcon);
  const equipmentOptions = createOptions(uniqueEquipment, GearIcon);
  const workingDayOptions = createOptions(uniqueWorkingDay, CalendarIcon);
  const statusOptions = createOptions(uniqueStatus, CheckIcon);
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {table.getColumn('Cliente') && (
          <DataTableFacetedFilter
            customers={customers}
            column={table.getColumn('Cliente')}
            title="Clientes"
            options={clientOptions}
          />
        )}
        {table.getColumn('Servicios') && (
          <DataTableFacetedFilter
            services={services}
            column={table.getColumn('Servicios')}
            title="Servicios"
            options={servicesOptions}
          />
        )}
        {table.getColumn('Item') && (
          <DataTableFacetedFilter items={items} column={table.getColumn('Item')} title="Items" options={itemOptions} />
        )}
        {table.getColumn('Empleados') && (
          <DataTableFacetedFilter
            employees={employees}
            column={table.getColumn('Empleados')}
            title="Empleados"
            options={employeesOptions}
          />
        )}
        {table.getColumn('Equipos') && (
          <DataTableFacetedFilter
            equipment={equipment}
            column={table.getColumn('Equipos')}
            title="Equipos"
            options={equipmentOptions}
          />
        )}
        {table.getColumn('Jornada') && (
          <DataTableFacetedFilter
            customers={customers}
            column={table.getColumn('Jornada')}
            title="Jornada"
            options={workingDayOptions}
          />
        )}
        {/* {table.getColumn('Hora inicio') && (
          <DataTableFacetedFilter customers={customers} column={table.getColumn('Hora inicio')} title="Hora inicio" options={startTimeOptions} />
        )}
        {table.getColumn('Hora fin') && (
          <DataTableFacetedFilter customers={customers} column={table.getColumn('Hora fin')} title="Hora fin" options={endTimeOptions} />
        )} */}
        {table.getColumn('Estado') && (
          <DataTableFacetedFilter
            customers={customers}
            column={table.getColumn('Estado')}
            title="Estado"
            options={statusOptions}
          />
        )}
        {/* {table.getColumn('Descripción') && (
          <DataTableFacetedFilter customers={customers} column={table.getColumn('Descripción')} title="Descripción" options={descriptionOptions} />
        )} */}
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
