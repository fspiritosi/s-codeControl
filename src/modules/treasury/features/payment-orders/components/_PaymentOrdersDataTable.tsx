'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/shared/components/common/DataTable';
import type { DataTableFacetedFilterConfig } from '@/shared/components/common/DataTable/types';
import { paymentOrderColumns } from './columns';
import { getPaymentOrderFacets, getAllPaymentOrdersForExport } from '../actions.server';
import { PAYMENT_ORDER_STATUS_LABELS } from '../../../shared/validators';

const FILTER_CONFIG: DataTableFacetedFilterConfig[] = [
  { columnId: 'full_number', title: 'Nº', type: 'text' },
  { columnId: 'status', title: 'Estado', type: 'faceted' },
  { columnId: 'supplier', title: 'Proveedor', type: 'text' },
  { columnId: 'date', title: 'Fecha', type: 'dateRange' },
  { columnId: 'scheduled_payment_date', title: 'Pago programado', type: 'dateRange' },
];

interface Props {
  data: any[];
  totalRows: number;
  searchParams: Record<string, string | undefined>;
}

export function PaymentOrdersDataTable({ data, totalRows, searchParams }: Props) {
  const [facets, setFacets] = useState<Record<string, { value: string; count: number }[]> | null>(null);

  useEffect(() => {
    getPaymentOrderFacets()
      .then((f) => setFacets(f as Record<string, { value: string; count: number }[]>))
      .catch(console.error);
  }, []);

  const facetedFilters = FILTER_CONFIG.map((filter) => {
    if (filter.type !== 'faceted' || !facets?.[filter.columnId]) return filter;

    const entries = facets[filter.columnId];
    return {
      ...filter,
      options: entries.map((f) => ({
        label: PAYMENT_ORDER_STATUS_LABELS[f.value as keyof typeof PAYMENT_ORDER_STATUS_LABELS] || f.value,
        value: f.value,
      })),
      externalCounts: new Map(entries.map((f) => [f.value, f.count])),
    };
  });

  return (
    <DataTable
      columns={paymentOrderColumns as any}
      data={data}
      totalRows={totalRows}
      searchParams={searchParams}
      searchPlaceholder="Buscar por Nº, proveedor o notas..."
      facetedFilters={facetedFilters}
      tableId="payment-orders-list"
      showFilterToggle
      exportConfig={{
        fetchAllData: () => getAllPaymentOrdersForExport(),
        options: {
          filename: 'ordenes-de-pago',
          sheetName: 'Órdenes de Pago',
          title: 'Listado de Órdenes de Pago',
          includeDate: true,
        },
      }}
    />
  );
}
