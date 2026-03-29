'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/shared/components/common/DataTable';
import type { DataTableFacetedFilterConfig } from '@/shared/components/common/DataTable/types';
import { purchaseOrderColumns } from './columns';
import { getPurchaseOrderFacets } from '../actions.server';
import { PO_STATUS_LABELS, PO_INVOICING_STATUS_LABELS } from '@/modules/purchasing/shared/types';

const FILTER_CONFIG: DataTableFacetedFilterConfig[] = [
  { columnId: 'status', title: 'Estado', type: 'faceted' },
  { columnId: 'invoicing_status', title: 'Facturación', type: 'faceted' },
];

interface Props {
  data: any[];
  totalRows: number;
  searchParams: Record<string, string | undefined>;
}

export function PurchaseOrdersDataTable({ data, totalRows, searchParams }: Props) {
  const [facets, setFacets] = useState<Record<string, { value: string; count: number }[]> | null>(null);

  useEffect(() => {
    getPurchaseOrderFacets().then(setFacets).catch(console.error);
  }, []);

  const facetedFilters = FILTER_CONFIG.map((filter) => {
    if (filter.type !== 'faceted' || !facets?.[filter.columnId]) return filter;
    const labelMap = filter.columnId === 'status' ? PO_STATUS_LABELS : PO_INVOICING_STATUS_LABELS;
    return {
      ...filter,
      options: facets[filter.columnId].map((f) => ({
        label: labelMap[f.value] || f.value,
        value: f.value,
        count: f.count,
      })),
    };
  });

  return (
    <DataTable
      columns={purchaseOrderColumns as any}
      data={data}
      totalRows={totalRows}
      searchParams={searchParams}
      searchPlaceholder="Buscar por número o proveedor..."
      facetedFilters={facetedFilters}
      tableId="purchase-orders"
      showFilterToggle
    />
  );
}
