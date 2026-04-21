'use client';

import { DataTable } from '@/shared/components/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { useState, useMemo } from 'react';
import { Button } from '@/shared/components/ui/button';

interface DataCategoryProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[] | any;
  data: TData[];
  localStorageName: string;
}

export function DataCategory<TData extends Record<string, unknown>, TValue>({
  columns,
  data,
  localStorageName,
}: DataCategoryProps<TData, TValue>) {
  const [showInactive, setShowInactive] = useState(false);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const isActive = (item as Record<string, unknown>).is_active;
      return showInactive ? !isActive : isActive;
    });
  }, [data, showInactive]);

  const defaultVisibleColumns = ['name', 'guild_id', 'covenant_id'];

  const initialColumnVisibility = useMemo(() => {
    const visibility: Record<string, boolean> = {};
    for (const column of columns) {
      const key = (column as unknown as { accessorKey?: string }).accessorKey;
      if (key) {
        // Hide the phantom "show inactive" toggle column
        if (key === 'showUnavaliableCovenant') {
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
      searchColumn="name"
      showSearch
      showColumnToggle
      tableId={localStorageName}
      initialColumnVisibility={initialColumnVisibility}
      pageSizeOptions={[20, 40, 60, 80, 100]}
      emptyMessage="No hay Categorías registradas"
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
