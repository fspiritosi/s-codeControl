'use client';

import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/shared/components/common/DataTable';
import type { DataTableFacetedFilterConfig } from '@/shared/components/common/DataTable/types';
import { buildWarehouseStockColumns } from './stockColumns';
import {
  getAllWarehouseStocksForExport,
  getWarehouseStockFacets,
} from '@/modules/warehouse/features/list/actions.server';

const FILTER_CONFIG: DataTableFacetedFilterConfig[] = [
  { columnId: 'product_name', title: 'Producto', type: 'text' },
  { columnId: 'product_code', title: 'Código', type: 'text' },
  { columnId: 'unit_of_measure', title: 'Unidad', type: 'faceted' },
];

interface Props {
  warehouseId: string;
  warehouseName: string;
  data: any[];
  totalRows: number;
  searchParams: Record<string, string | undefined>;
  showCompany?: boolean;
}

export function WarehouseStockDataTable({
  warehouseId,
  warehouseName,
  data,
  totalRows,
  searchParams,
  showCompany = false,
}: Props) {
  const columns = useMemo(() => buildWarehouseStockColumns({ showCompany }), [showCompany]);
  const [facets, setFacets] = useState<Record<string, { value: string; count: number }[]> | null>(
    null
  );

  useEffect(() => {
    getWarehouseStockFacets(warehouseId).then(setFacets).catch(console.error);
  }, [warehouseId]);

  const facetedFilters = FILTER_CONFIG.map((filter) => {
    if (filter.type !== 'faceted' || !facets?.[filter.columnId]) return filter;
    const entries = facets[filter.columnId];
    return {
      ...filter,
      options: entries.map((f) => ({ label: f.value, value: f.value })),
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
      tableId={`warehouse-stock-${warehouseId}`}
      showFilterToggle
      emptyMessage="No hay stock registrado en este almacén"
      exportConfig={{
        fetchAllData: () => getAllWarehouseStocksForExport(warehouseId, searchParams),
        options: {
          filename: `stock-${warehouseName}`,
          sheetName: 'Stock',
          title: `Stock — ${warehouseName}`,
          includeDate: true,
        },
      }}
    />
  );
}
