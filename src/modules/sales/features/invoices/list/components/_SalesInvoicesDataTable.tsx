'use client';

import { useState, useEffect, useMemo } from 'react';
import { DataTable } from '@/shared/components/data-table';
import type { DataTableFacetedFilterConfig } from '@/shared/components/data-table/types';
import { makeSalesInvoiceColumns } from './columns';
import { getSalesInvoiceFacets } from '../actions.server';
import { SALES_INVOICE_STATUS_LABELS, VOUCHER_TYPE_LABELS } from '@/modules/sales/shared/types';

const FILTER_CONFIG: DataTableFacetedFilterConfig[] = [
  { columnId: 'full_number', title: 'Comprobante', type: 'text' },
  { columnId: 'voucher_type', title: 'Tipo', type: 'faceted' },
  { columnId: 'customer', title: 'Cliente', type: 'text' },
  { columnId: 'issue_date', title: 'Fecha', type: 'dateRange' },
  { columnId: 'status', title: 'Estado', type: 'faceted' },
];

interface Props {
  data: any[];
  totalRows: number;
  searchParams: Record<string, string | undefined>;
}

export function SalesInvoicesDataTable({ data, totalRows, searchParams }: Props) {
  const [facets, setFacets] = useState<Record<string, { value: string; count: number }[]> | null>(null);
  const columns = useMemo(() => makeSalesInvoiceColumns(), []);

  useEffect(() => {
    getSalesInvoiceFacets().then(setFacets).catch(console.error);
  }, []);

  const facetedFilters = FILTER_CONFIG.map((filter) => {
    if (filter.type !== 'faceted' || !facets?.[filter.columnId]) return filter;
    const labelMap = filter.columnId === 'status' ? SALES_INVOICE_STATUS_LABELS : VOUCHER_TYPE_LABELS;
    const entries = facets[filter.columnId];
    return {
      ...filter,
      options: entries.map((f) => ({
        label: labelMap[f.value] || f.value,
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
      searchPlaceholder="Buscar por comprobante o cliente..."
      facetedFilters={facetedFilters}
      tableId="sales-invoices"
      showFilterToggle
    />
  );
}
