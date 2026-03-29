'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/shared/components/common/DataTable';
import type { DataTableFacetedFilterConfig } from '@/shared/components/common/DataTable/types';
import { withdrawalColumns } from './columns';
import { getWithdrawalOrderFacets } from '../actions.server';

const STATUS_LABELS: Record<string, string> = { DRAFT: 'Borrador', PENDING_APPROVAL: 'Pendiente', APPROVED: 'Aprobada', COMPLETED: 'Completada', CANCELLED: 'Cancelada' };

const FILTER_CONFIG: DataTableFacetedFilterConfig[] = [
  { columnId: 'full_number', title: 'Número', type: 'text' },
  { columnId: 'warehouse', title: 'Almacén', type: 'text' },
  { columnId: 'request_date', title: 'Fecha', type: 'dateRange' },
  { columnId: 'employee', title: 'Retira', type: 'text' },
  { columnId: 'vehicle', title: 'Equipo', type: 'text' },
  { columnId: 'status', title: 'Estado', type: 'faceted' },
];

interface Props { data: any[]; totalRows: number; searchParams: Record<string, string | undefined>; }

export function WithdrawalsDataTable({ data, totalRows, searchParams }: Props) {
  const [facets, setFacets] = useState<Record<string, { value: string; count: number }[]> | null>(null);
  useEffect(() => { getWithdrawalOrderFacets().then(setFacets).catch(console.error); }, []);

  const facetedFilters = FILTER_CONFIG.map((f) => {
    if (f.type !== 'faceted' || !facets?.[f.columnId]) return f;
    return { ...f, options: facets[f.columnId].map((e) => ({ label: STATUS_LABELS[e.value] || e.value, value: e.value, count: e.count })) };
  });

  return <DataTable columns={withdrawalColumns as any} data={data} totalRows={totalRows} searchParams={searchParams}
    searchPlaceholder="Buscar por número o empleado..." facetedFilters={facetedFilters} tableId="withdrawal-orders" showFilterToggle />;
}
