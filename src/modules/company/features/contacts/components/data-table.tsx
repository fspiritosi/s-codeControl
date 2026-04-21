'use client';

import { DataTable } from '@/shared/components/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { useState, useMemo } from 'react';
import { Button } from '@/shared/components/ui/button';

interface DataContactsProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[] | any;
  data: TData[];
  localStorageName: string;
}

export function DataContacts<TData extends Record<string, unknown>, TValue>({
  columns,
  data,
  localStorageName,
}: DataContactsProps<TData, TValue>) {
  const [showInactive, setShowInactive] = useState(false);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const isActive = (item as Record<string, unknown>).is_active;
      return showInactive ? !isActive : isActive;
    });
  }, [data, showInactive]);

  const defaultVisibleColumns = [
    'contact_name',
    'constact_email',
    'contact_phone',
    'contact_charge',
    'customers.name',
  ];

  const initialColumnVisibility = useMemo(() => {
    const visibility: Record<string, boolean> = {};
    for (const column of columns) {
      const key = (column as unknown as { accessorKey?: string }).accessorKey;
      if (key) {
        if (key === 'showUnavaliableContacts') {
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
      data={filteredData}
      searchPlaceholder="Buscar por Nombre"
      searchColumn="contact_name"
      showSearch
      showColumnToggle
      tableId={localStorageName}
      initialColumnVisibility={initialColumnVisibility}
      pageSizeOptions={[20, 40, 60, 80, 100]}
      emptyMessage="No hay Contactos registrados"
      toolbarActions={
        <Button
          variant={showInactive ? 'destructive' : 'outline'}
          size="sm"
          onClick={() => setShowInactive(!showInactive)}
        >
          {showInactive ? 'Ver activos' : 'Ver dados de baja'}
        </Button>
      }
      rowClassName={(row) => {
        const isActive = (row as Record<string, unknown>).is_active;
        return isActive ? '' : 'text-red-500';
      }}
    />
  );
}
