'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/shared/components/common/DataTable';
import type { DataTableFacetedFilterConfig } from '@/shared/components/common/DataTable/types';
import { movementColumns } from './columns';
import { getMovementTypeFacets } from '@/modules/warehouse/features/list/actions.server';
import { STOCK_MOVEMENT_TYPE_LABELS } from '@/modules/warehouse/shared/types';

const FILTER_CONFIG: DataTableFacetedFilterConfig[] = [
  { columnId: 'type', title: 'Tipo', type: 'faceted' },
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
    return {
      ...filter,
      options: facets[filter.columnId].map((f) => ({
        label: STOCK_MOVEMENT_TYPE_LABELS[f.value] || f.value,
        value: f.value,
        count: f.count,
      })),
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
    />
  );
}
