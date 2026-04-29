'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/shared/components/common/DataTable';
import type { DataTableFacetedFilterConfig } from '@/shared/components/common/DataTable/types';
import { movementColumns } from './columns';
import { getMovementTypeFacets } from '@/modules/warehouse/features/list/actions.server';
import { STOCK_MOVEMENT_TYPE_LABELS } from '@/modules/warehouse/shared/types';

const FILTER_CONFIG: DataTableFacetedFilterConfig[] = [
  { columnId: 'date', title: 'Fecha', type: 'dateRange' },
  { columnId: 'type', title: 'Tipo', type: 'faceted' },
  { columnId: 'product', title: 'Producto', type: 'text' },
  { columnId: 'warehouse', title: 'Almacén', type: 'text' },
  { columnId: 'notes', title: 'Notas', type: 'text' },
];

interface Props {
  data: any[];
  totalRows: number;
  searchParams: Record<string, string | undefined>;
}

export function MovementsDataTable({ data, totalRows, searchParams }: Props) {
  const [facets, setFacets] = useState<Record<string, { value: string; count: number }[]> | null>(null);

  useEffect(() => {
    getMovementTypeFacets().then(setFacets).catch(console.error);
  }, []);

  const facetedFilters = FILTER_CONFIG.map((filter) => {
    if (filter.type !== 'faceted' || !facets?.[filter.columnId]) return filter;
    const entries = facets[filter.columnId];
    return {
      ...filter,
      options: entries.map((f) => ({
        label: STOCK_MOVEMENT_TYPE_LABELS[f.value] || f.value,
        value: f.value,
      })),
      externalCounts: new Map(entries.map((f) => [f.value, f.count])),
    };
  });

  return (
    <DataTable
      columns={movementColumns as any}
      data={data}
      totalRows={totalRows}
      searchParams={searchParams}
      searchPlaceholder="Buscar por producto, almacén o notas..."
      facetedFilters={facetedFilters}
      tableId="stock-movements"
      showFilterToggle
    />
  );
}
