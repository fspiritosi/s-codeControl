'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/shared/components/common/DataTable';
import type { DataTableFacetedFilterConfig } from '@/shared/components/common/DataTable/types';
import { receivingNoteColumns } from './columns';
import { getReceivingNoteFacets } from '../actions.server';
import { RECEIVING_NOTE_STATUS_LABELS } from '@/modules/purchasing/shared/types';

const FILTER_CONFIG: DataTableFacetedFilterConfig[] = [
  { columnId: 'full_number', title: 'Número', type: 'text' },
  { columnId: 'supplier', title: 'Proveedor', type: 'text' },
  { columnId: 'warehouse', title: 'Almacén', type: 'text' },
  { columnId: 'reception_date', title: 'Fecha recepción', type: 'dateRange' },
  { columnId: 'status', title: 'Estado', type: 'faceted' },
];

interface Props {
  data: any[];
  totalRows: number;
  searchParams: Record<string, string | undefined>;
}

export function ReceivingNotesDataTable({ data, totalRows, searchParams }: Props) {
  const [facets, setFacets] = useState<Record<string, { value: string; count: number }[]> | null>(null);

  useEffect(() => {
    getReceivingNoteFacets().then(setFacets).catch(console.error);
  }, []);

  const facetedFilters = FILTER_CONFIG.map((filter) => {
    if (filter.type !== 'faceted' || !facets?.[filter.columnId]) return filter;
    const entries = facets[filter.columnId];
    return {
      ...filter,
      options: entries.map((f) => ({
        label: RECEIVING_NOTE_STATUS_LABELS[f.value] || f.value,
        value: f.value,
      })),
      externalCounts: new Map(entries.map((f) => [f.value, f.count])),
    };
  });

  return (
    <DataTable
      columns={receivingNoteColumns as any}
      data={data}
      totalRows={totalRows}
      searchParams={searchParams}
      searchPlaceholder="Buscar por número o proveedor..."
      facetedFilters={facetedFilters}
      tableId="receiving-notes"
      showFilterToggle
    />
  );
}
