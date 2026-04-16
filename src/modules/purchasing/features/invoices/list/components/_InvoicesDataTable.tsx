'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/shared/components/common/DataTable';
import type { DataTableFacetedFilterConfig } from '@/shared/components/common/DataTable/types';
import { invoiceColumns } from './columns';
import { getInvoiceFacets } from '../actions.server';
import { INVOICE_STATUS_LABELS, VOUCHER_TYPE_LABELS, INVOICE_RECEIVING_STATUS_LABELS } from '@/modules/purchasing/shared/types';

const FILTER_CONFIG: DataTableFacetedFilterConfig[] = [
  { columnId: 'full_number', title: 'Número', type: 'text' },
  { columnId: 'voucher_type', title: 'Tipo', type: 'faceted' },
  { columnId: 'supplier', title: 'Proveedor', type: 'text' },
  { columnId: 'issue_date', title: 'Fecha', type: 'dateRange' },
  { columnId: 'status', title: 'Estado', type: 'faceted' },
  { columnId: 'receiving_status', title: 'Recepción', type: 'faceted' },
];

interface Props {
  data: any[];
  totalRows: number;
  searchParams: Record<string, string | undefined>;
}

export function InvoicesDataTable({ data, totalRows, searchParams }: Props) {
  const [facets, setFacets] = useState<Record<string, { value: string; count: number }[]> | null>(null);

  useEffect(() => {
    getInvoiceFacets().then(setFacets).catch(console.error);
  }, []);

  const facetedFilters = FILTER_CONFIG.map((filter) => {
    if (filter.type !== 'faceted' || !facets?.[filter.columnId]) return filter;
    const labelMap = filter.columnId === 'status' ? INVOICE_STATUS_LABELS : filter.columnId === 'receiving_status' ? INVOICE_RECEIVING_STATUS_LABELS : VOUCHER_TYPE_LABELS;
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
      columns={invoiceColumns as any}
      data={data}
      totalRows={totalRows}
      searchParams={searchParams}
      searchPlaceholder="Buscar por número o proveedor..."
      facetedFilters={facetedFilters}
      tableId="purchase-invoices"
      showFilterToggle
    />
  );
}
