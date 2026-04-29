'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/shared/components/common/DataTable';
import type { DataTableFacetedFilterConfig } from '@/shared/components/common/DataTable/types';
import { productColumns } from './columns';
import { getProductFacets, getAllProductsForExport } from '../actions.server';
import { PRODUCT_TYPE_LABELS, PRODUCT_STATUS_LABELS } from '@/modules/products/shared/types';

const FILTER_CONFIG: DataTableFacetedFilterConfig[] = [
  { columnId: 'code', title: 'Código', type: 'text' },
  { columnId: 'name', title: 'Nombre', type: 'text' },
  { columnId: 'type', title: 'Tipo', type: 'faceted' },
  { columnId: 'unit_of_measure', title: 'Unidad', type: 'text' },
  { columnId: 'status', title: 'Estado', type: 'faceted' },
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
    const labelMap = filter.columnId === 'type' ? PRODUCT_TYPE_LABELS : PRODUCT_STATUS_LABELS;
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
      columns={productColumns as any}
      data={data}
      totalRows={totalRows}
      searchParams={searchParams}
      searchPlaceholder="Buscar por nombre, código o marca..."
      facetedFilters={facetedFilters}
      tableId="products-list"
      showFilterToggle
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
