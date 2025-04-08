'use client';

import { Cross2Icon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { criticidad, statuses } from '../data';
import { DataTableFacetedFilter } from './data-table-faceted-filter';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  storageKey?: string;
}

export function DataTableToolbar<TData>({ 
  table, 
  storageKey = 'data-table-filters' 
}: DataTableToolbarProps<TData>) {
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const isFiltered = table.getState().columnFilters.length > 0;

  // Cargar filtros guardados al montar el componente
  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialLoad) {
      try {
        const savedFilters = sessionStorage.getItem(storageKey);
        if (savedFilters) {
          const parsedFilters = JSON.parse(savedFilters);
          if (Array.isArray(parsedFilters)) {
            table.setColumnFilters(parsedFilters);
          }
        }
      } catch (error) {
        console.error('Error loading filters from sessionStorage:', error);
        sessionStorage.removeItem(storageKey);
      }
      setIsInitialLoad(false);
    }
  }, [table, storageKey, isInitialLoad]);

  // Observar cambios en los filtros y guardarlos
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialLoad) {
      try {
        const filters = table.getState().columnFilters;
        sessionStorage.setItem(storageKey, JSON.stringify(filters));
      } catch (error) {
        console.error('Error saving filters to sessionStorage:', error);
      }
    }
  }, [table.getState().columnFilters, storageKey, isInitialLoad]);

  const handleClearFilters = () => {
    table.resetColumnFilters();
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(storageKey);
    }
  };

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
    </div>
  );
}