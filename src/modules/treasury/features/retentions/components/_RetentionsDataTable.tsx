'use client';

import { DataTable } from '@/shared/components/common/DataTable';
import type { DataTableFacetedFilterConfig } from '@/shared/components/common/DataTable/types';
import { PAYMENT_ORDER_STATUS_LABELS } from '@/modules/treasury/shared/validators';
import { retentionColumns } from './columns';
import { getAllRetentionsForExport, type RetentionRow } from '../actions.server';
import { format } from 'date-fns';

interface Props {
  data: RetentionRow[];
  totalRows: number;
  searchParams: Record<string, string | undefined>;
  taxTypeOptions: { id: string; code: string; name: string }[];
}

export function RetentionsDataTable({ data, totalRows, searchParams, taxTypeOptions }: Props) {
  const filterConfig: DataTableFacetedFilterConfig[] = [
    { columnId: 'payment_order_date', title: 'Fecha', type: 'dateRange' },
    { columnId: 'supplier', title: 'Proveedor', type: 'text' },
    {
      columnId: 'tax_type',
      title: 'Tipo',
      type: 'faceted',
      options: taxTypeOptions.map((t) => ({ label: t.name, value: t.id })),
    },
    {
      columnId: 'payment_order_status',
      title: 'Estado OP',
      type: 'faceted',
      options: Object.entries(PAYMENT_ORDER_STATUS_LABELS).map(([value, label]) => ({
        label,
        value,
      })),
    },
  ];

  return (
    <DataTable
      columns={retentionColumns as any}
      data={data as any}
      totalRows={totalRows}
      searchParams={searchParams}
      searchPlaceholder="Buscar por OP, proveedor o N° de certificado..."
      facetedFilters={filterConfig}
      tableId="retentions"
      showFilterToggle
      exportConfig={{
        fetchAllData: () =>
          getAllRetentionsForExport(searchParams).then(
            (rows) => rows as unknown as Record<string, unknown>[]
          ),
        options: {
          filename: 'retenciones',
          sheetName: 'Retenciones',
          title: 'Retenciones aplicadas',
          includeDate: true,
        },
        formatters: {
          payment_order_date: (v) =>
            v ? format(new Date(v as string), 'dd/MM/yyyy') : '',
          payment_order_status: (v) =>
            (PAYMENT_ORDER_STATUS_LABELS as Record<string, string>)[v as string] ?? String(v ?? ''),
          tax_type_name: (_v, row) => {
            const r = row as unknown as RetentionRow;
            return r.tax_type_jurisdiction
              ? `${r.tax_type_name} (${r.tax_type_jurisdiction})`
              : r.tax_type_name;
          },
          rate: (v) => `${v}%`,
        },
        excludeColumns: ['notes'],
      }}
    />
  );
}
