'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/shared/components/common/DataTable';
import type { DataTableFacetedFilterConfig } from '@/shared/components/common/DataTable/types';
import { productColumns } from './columns';
import { getProductFacets, getAllProductsForExport } from '../actions.server';
import { PRODUCT_TYPE_LABELS, PRODUCT_STATUS_LABELS } from '@/modules/products/shared/types';

const FILTER_CONFIG: DataTableFacetedFilterConfig[] = [
  { columnId: 'type', title: 'Tipo', type: 'faceted' },
  { columnId: 'status', title: 'Estado', type: 'faceted' },
  { columnId: 'name', title: 'Nombre', type: 'text' },
];

interface Props {
  data: any[];
  totalRows: number;
  searchParams: Record<string, string | undefined>;
}

export function ProductsDataTable({ data, totalRows, searchParams }: Props) {
  const [facets, setFacets] = useState<Record<string, { value: string; count: number }[]> | null>(null);

  useEffect(() => {
    getProductFacets().then(setFacets).catch(console.error);
  }, []);

  const facetedFilters = FILTER_CONFIG.map((filter) => {
    if (filter.type !== 'faceted' || !facets?.[filter.columnId]) return filter;

    return {
      ...filter,
      options: facets[filter.columnId].map((f: { value: string; count: number }) => {
        const labelMap = filter.columnId === 'type' ? PRODUCT_TYPE_LABELS : PRODUCT_STATUS_LABELS;
        return {
          label: labelMap[f.value] || f.value,
          value: f.value,
          count: f.count,
        };
      }),
    };
  });

  return (
    <DataTable
      columns={productColumns as any}
      data={data}
      totalRows={totalRows}
      searchParams={searchParams}
      searchPlaceholder="Buscar por nombre, código o marca..."
      facetedFilters={facetedFilters}
      tableId="products-list"
      exportConfig={{
        fetchAllData: () => getAllProductsForExport(),
        options: {
          filename: 'productos',
          sheetName: 'Productos',
          title: 'Catálogo de Productos',
          includeDate: true,
        },
      }}
    />
  );
}
