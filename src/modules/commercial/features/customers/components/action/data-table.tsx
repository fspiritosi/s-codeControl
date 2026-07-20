'use client';

import { DataTable } from '@/shared/components/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { useState, useMemo } from 'react';
import { Button } from '@/shared/components/ui/button';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[] | any;
  data: TData[];
  setInactiveEmployees: () => void;
  setActivesEmployees: () => void;
  showDeletedEmployees: boolean;
  setShowDeletedEmployees: (showDeletedEmployees: boolean) => void;
}

export function DataTableCustomerAction<TData extends Record<string, unknown>, TValue>({
  columns,
  data,
  setActivesEmployees,
  setInactiveEmployees,
  showDeletedEmployees,
  setShowDeletedEmployees,
}: DataTableProps<TData, TValue>) {
  const defaultVisibleColumns = [
    'full_name',
    'status',
    'cuil',
    'document_number',
    'document_type',
    'hierarchical_position',
    'company_position',
    'normal_hours',
    'type_of_contract',
    'allocated_to',
  ];

  const initialColumnVisibility = useMemo(() => {
    const visibility: Record<string, boolean> = {};
    for (const column of columns) {
      const key = (column as unknown as { accessorKey?: string }).accessorKey;
      if (key) {
        if (key === 'showUnavaliableEmployees') {
          visibility[key] = false;
        } else {
          visibility[key] = defaultVisibleColumns.includes(key);
        }
      }
    }
    return visibility;
  }, [columns]);

  return (
    <DataTable
      columns={columns}
      data={data}
      searchPlaceholder="Buscar por nombre"
      searchColumn="full_name"
      showSearch
      showColumnToggle
      initialColumnVisibility={initialColumnVisibility}
      pageSizeOptions={[20, 40, 60, 80, 100]}
      emptyMessage={showDeletedEmployees ? 'No hay empleados inactivos' : 'No hay empleados activos'}
      toolbarActions={
        <Button
          variant={showDeletedEmployees ? 'destructive' : 'outline'}
          size="sm"
          onClick={() => {
            const newValue = !showDeletedEmployees;
            setShowDeletedEmployees(newValue);
            newValue ? setInactiveEmployees() : setActivesEmployees();
          }}
        >
          {showDeletedEmployees ? 'Ver activos' : 'Ver empleados dados de baja'}
        </Button>
      }
      rowClassName={(row) => {
        const isActive = (row as Record<string, unknown>).is_active;
        return isActive ? '' : 'text-red-500';
      }}
    />
  );
}
