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
  storageKey?: string;
}

export function DataTableToolbarDetailReport<TData>({
  table,
  storageKey = 'detail-report-filters'
}: DataTableToolbarProps<TData>) {
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const isFiltered = table.getState().columnFilters.length > 0;
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Cargar estado guardado al montar el componente
  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialLoad) {
      try {
        const savedState = sessionStorage.getItem(storageKey);
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          
          // Aplicar filtros de columnas
          if (Array.isArray(parsedState.columnFilters)) {
            table.setColumnFilters(parsedState.columnFilters);
          }
          
          // Aplicar fechas
          if (parsedState.startDate) {
            setStartDate(new Date(parsedState.startDate));
          }
          if (parsedState.endDate) {
            setEndDate(new Date(parsedState.endDate));
          }
        }
      } catch (error) {
        console.error('Error loading filters from sessionStorage:', error);
        sessionStorage.removeItem(storageKey);
      }
      setIsInitialLoad(false);
    }
  }, [table, storageKey, isInitialLoad]);

  // Guardar estado cuando cambia
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialLoad) {
      try {
        const stateToSave = {
          columnFilters: table.getState().columnFilters,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString()
        };
        sessionStorage.setItem(storageKey, JSON.stringify(stateToSave));
      } catch (error) {
        console.error('Error saving filters to sessionStorage:', error);
      }
    }
  }, [table.getState().columnFilters, startDate, endDate, storageKey, isInitialLoad]);

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
    }
  };

  useEffect(() => {
    handleDateChange();
  }, [startDate, endDate]);

  const handleClearFilters = () => {
    table.resetColumnFilters();
    setStartDate(undefined);
    setEndDate(undefined);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(storageKey);
    }
  };

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
            onClick={handleClearFilters} 
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