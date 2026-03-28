'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/shared/components/common/DataTable';
import type { DataTableFacetedFilterConfig } from '@/shared/components/common/DataTable/types';
import { supplierColumns } from './columns';
import { getSupplierFacets, getAllSuppliersForExport } from '../actions.server';
import { TAX_CONDITION_LABELS, SUPPLIER_STATUS_LABELS } from '@/modules/suppliers/shared/types';

const FILTER_CONFIG: DataTableFacetedFilterConfig[] = [
  { columnId: 'status', title: 'Estado', type: 'faceted' },
  { columnId: 'tax_condition', title: 'Condición IVA', type: 'faceted' },
];

interface Props {
  data: any[];
  totalRows: number;
  searchParams: Record<string, string | undefined>;
}

export function SuppliersDataTable({ data, totalRows, searchParams }: Props) {
  const [facets, setFacets] = useState<Record<string, { value: string; count: number }[]> | null>(null);

  useEffect(() => {
    getSupplierFacets().then(setFacets).catch(console.error);
  }, []);

  const facetedFilters = FILTER_CONFIG.map((filter) => {
    if (filter.type !== 'faceted' || !facets?.[filter.columnId]) return filter;

    const labelMap = filter.columnId === 'status' ? SUPPLIER_STATUS_LABELS : TAX_CONDITION_LABELS;
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
      columns={supplierColumns as any}
      data={data}
      totalRows={totalRows}
      searchParams={searchParams}
      searchPlaceholder="Buscar por razón social, nombre o CUIT..."
      facetedFilters={facetedFilters}
      tableId="suppliers-list"
      exportConfig={{
        fetchAllData: () => getAllSuppliersForExport(),
        options: {
          filename: 'proveedores',
          sheetName: 'Proveedores',
          title: 'Listado de Proveedores',
          includeDate: true,
        },
      }}
    />
  );
}
