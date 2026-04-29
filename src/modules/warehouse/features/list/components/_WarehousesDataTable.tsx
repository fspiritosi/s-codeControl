'use client';

import { useState, useEffect, useMemo } from 'react';
import { DataTable } from '@/shared/components/common/DataTable';
import type { DataTableFacetedFilterConfig } from '@/shared/components/common/DataTable/types';
import { buildWarehouseColumns } from './columns';
import { getWarehouseFacets } from '../actions.server';
import { WAREHOUSE_TYPE_LABELS } from '@/modules/warehouse/shared/types';

const FILTER_CONFIG: DataTableFacetedFilterConfig[] = [
  { columnId: 'name', title: 'Nombre', type: 'text' },
  { columnId: 'type', title: 'Tipo', type: 'faceted' },
  { columnId: 'city', title: 'Ubicación', type: 'text' },
];

interface Props {
  data: any[];
  totalRows: number;
  searchParams: Record<string, string | undefined>;
  showCompany?: boolean;
}

export function WarehousesDataTable({ data, totalRows, searchParams, showCompany = false }: Props) {
  const columns = useMemo(() => buildWarehouseColumns({ showCompany }), [showCompany]);
  const [facets, setFacets] = useState<Record<string, { value: string; count: number }[]> | null>(null);

  useEffect(() => {
    getWarehouseFacets().then(setFacets).catch(console.error);
  }, []);

  const facetedFilters = FILTER_CONFIG.map((filter) => {
    if (filter.type !== 'faceted' || !facets?.[filter.columnId]) return filter;
    const entries = facets[filter.columnId];
    return {
      ...filter,
      options: entries.map((f) => ({
        label: WAREHOUSE_TYPE_LABELS[f.value] || f.value,
        value: f.value,
      })),
      externalCounts: new Map(entries.map((f) => [f.value, f.count])),
    };
  });

  return (
    <DataTable
      columns={columns as any}
      data={data}
      totalRows={totalRows}
      searchParams={searchParams}
      searchPlaceholder="Buscar por nombre o código..."
      facetedFilters={facetedFilters}
      tableId="warehouses-list"
      showFilterToggle
    />
  );
}
