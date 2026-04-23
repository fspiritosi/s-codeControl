'use client';

import { useMemo } from 'react';
import { ColumnDef, ColumnFiltersState } from '@tanstack/react-table';
import { useSearchParams } from 'next/navigation';
import { DataTable } from '@/shared/components/data-table';
import type { DataTableFacetedFilterConfig } from '@/shared/components/data-table';
import { criticidad, statuses } from './data';

interface RepairSolicitudesClientProps<TData extends Record<string, unknown>> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
}

const VALID_STATES = new Set(statuses.map((s) => s.value));

export function RepairSolicitudesClient<TData extends Record<string, unknown>>({
  data,
  columns,
}: RepairSolicitudesClientProps<TData>) {
  const searchParams = useSearchParams();

  const initialColumnFilters = useMemo<ColumnFiltersState>(() => {
    const stateParam = searchParams.get('state');
    if (!stateParam) return [];
    const values = stateParam.split(',').filter((v) => VALID_STATES.has(v));
    return values.length > 0 ? [{ id: 'state', value: values }] : [];
  }, [searchParams]);

  const facetedFilters = useMemo(() => {
    // Build dynamic options for equipment and title from data
    const equipmentSet = new Set<string>();
    const titleSet = new Set<string>();
    for (const row of data) {
      const domain = (row as any).domain;
      const title = (row as any).title;
      if (domain) equipmentSet.add(domain);
      if (title) titleSet.add(title);
    }

    const filters: DataTableFacetedFilterConfig[] = [
      {
        columnId: 'state',
        title: 'Estado',
        options: statuses.map((s) => ({ label: s.label, value: s.value })),
      },
      {
        columnId: 'title',
        title: 'Titulo',
        options: Array.from(titleSet).map((v) => ({ label: v, value: v })),
      },
      {
        columnId: 'priority',
        title: 'Criticidad',
        options: criticidad.map((c) => ({ label: c.label, value: c.value })),
      },
      {
        columnId: 'domain',
        title: 'Equipo',
        options: Array.from(equipmentSet).map((v) => ({ label: v, value: v })),
      },
    ];

    return filters;
  }, [data]);

  return (
    <div className="mt-8">
      <DataTable
        columns={columns}
        data={data}
        emptyMessage="Sin resultados."
        facetedFilters={facetedFilters}
        initialColumnFilters={initialColumnFilters}
        showColumnToggle={false}
        tableId="repair-solicitudes"
      />
    </div>
  );
}
