'use client';

import { DataTableFacetedFilter } from '@/components/DailyReport/tables/data-table-faceted-filter';
import { DataTableViewOptions } from '@/components/CheckList/tables/data-table-view-options';
import { Button } from '@/components/ui/button';
import {
  CalendarIcon,
  CheckIcon,
  Cross2Icon,
  FileTextIcon,
  GearIcon,
  PersonIcon,
} from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { useState, useEffect } from 'react';
import moment from 'moment';
import { DatePicker } from '@/components/DailyReport/DatePicker';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbarDetailReport<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const getUniqueValues = (columnId: string) => {
    return table.getColumn(columnId)?.getFacetedUniqueValues()
      ? Array.from(
          new Set(
            Array.from((table.getColumn(columnId)?.getFacetedUniqueValues() as any)?.keys()).map((item: any) => item)
          )
        )
      : [];
  };

  const uniqueClient = getUniqueValues('Cliente');
  const uniqueItem = getUniqueValues('Item');
  const uniqueServices = getUniqueValues('Servicios');
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
  const workingDayOptions = createOptions(uniqueWorkingDay, CalendarIcon);
  const statusOptions = createOptions(uniqueStatus, CheckIcon);

  const handleDateChange = () => {
    if (startDate && endDate) {
      const formattedStartDate = moment(startDate).format('DD/MM/YYYY');
      const formattedEndDate = moment(endDate).format('DD/MM/YYYY');
      table.getColumn('Fecha')?.setFilterValue([formattedStartDate, formattedEndDate]);
      
      const filteredData = table.getFilteredRowModel().rows.filter((row) => {
        const rowDate = moment((row.original as { date: string }).date, 'YYYY/MM/DD');
        return rowDate.isBetween(startDate, endDate, undefined, '[]');
      });
      
     
    }
  };

  useEffect(() => {
    handleDateChange();
  }, [startDate, endDate]);

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {table.getColumn('Fecha') && (
          <div className="flex items-center space-x-2">
            <DatePicker
              date={startDate}
              setDate={setStartDate}
              label="Fecha de inicio"
            />
            <DatePicker
              date={endDate}
              setDate={setEndDate}
              label="Fecha de fin"
            />
          </div>
        )}
        {table.getColumn('Cliente') && (
          <DataTableFacetedFilter
            column={table.getColumn('Cliente')}
            title="Clientes"
            options={clientOptions}
          />
        )}
        {table.getColumn('Servicios') && (
          <DataTableFacetedFilter
            column={table.getColumn('Servicios')}
            title="Servicios"
            options={servicesOptions}
          />
        )}
        {table.getColumn('Item') && (
          <DataTableFacetedFilter 
            column={table.getColumn('Item')} 
            title="Items" 
            options={itemOptions} 
          />
        )}
        {table.getColumn('Jornada') && (
          <DataTableFacetedFilter
            column={table.getColumn('Jornada')}
            title="Jornada"
            options={workingDayOptions}
          />
        )}
        {table.getColumn('Estado') && (
          <DataTableFacetedFilter
            column={table.getColumn('Estado')}
            title="Estado"
            options={statusOptions}
          />
        )}
        {isFiltered && (
          <Button 
            variant="ghost" 
            onClick={() => {
              table.resetColumnFilters();
              setStartDate(undefined);
              setEndDate(undefined);
            }} 
            className="h-8 px-2 lg:px-3"
          >
            Limpiar filtros
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}