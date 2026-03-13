'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/shared/components/data-table';
import type { DataTableFacetedFilterConfig } from '@/shared/components/data-table';
import { ExpiringDocumentDownloadButton } from './data-table-toolbar-expiring-document';

interface DataTableProps<TData extends Record<string, unknown>, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function ExpiringDocumentTable<TData extends Record<string, unknown>, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const facetedFilters = React.useMemo(() => {
    const filters: DataTableFacetedFilterConfig[] = [];

    // Build dynamic options from data for each potential filter column
    const columnIds = ['Empleados', 'Equipment', 'Documentos'] as const;
    const columnTitles: Record<string, string> = {
      Empleados: 'Empleados',
      Equipment: 'Equipos',
      Documentos: 'Documentos',
    };

    for (const colId of columnIds) {
      const uniqueValues = new Set<string>();
      for (const row of data) {
        // Check if the column accessor exists in the data
        const val =
          colId === 'Empleados'
            ? (row as any).resource && (row as any).employee_id
              ? (row as any).resource
              : null
            : colId === 'Equipment'
              ? (row as any).resource && (row as any).vehicle_id && !(row as any).employee_id
                ? (row as any).resource
                : null
              : colId === 'Documentos'
                ? (row as any).documentName
                : null;
        if (val) uniqueValues.add(val);
      }

      if (uniqueValues.size > 0) {
        filters.push({
          columnId: colId,
          title: columnTitles[colId],
          options: Array.from(uniqueValues).map((v) => ({ label: v, value: v })),
        });
      }
    }

    return filters;
  }, [data]);

  return (
    <DataTable
      columns={columns}
      data={data}
      emptyMessage="Sin resultados"
      facetedFilters={facetedFilters}
      showColumnToggle={true}
      toolbarActions={<ExpiringDocumentDownloadButton data={data} />}
      tableId="expiring-documents"
    />
  );
}
