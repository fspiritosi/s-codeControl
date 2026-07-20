'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Plus } from 'lucide-react';
import { DataTable } from '@/shared/components/data-table';
import type { DataTableFacetedFilterConfig } from '@/shared/components/data-table/types';
import { makeReceiptColumns, type ReceiptRow } from './columns';
import { CreateReceiptModal } from './CreateReceiptModal';
import { ReceiptDetailModal } from './ReceiptDetailModal';
import { getReceiptFacets } from '../actions.server';
import { RECEIPT_STATUS_LABELS } from '@/modules/sales/shared/types';

const FILTER_CONFIG: DataTableFacetedFilterConfig[] = [
  { columnId: 'status', title: 'Estado', type: 'faceted' },
  { columnId: 'date', title: 'Fecha', type: 'dateRange' },
];

interface Props {
  data: ReceiptRow[];
  totalRows: number;
  searchParams: Record<string, string | undefined>;
}

export function ReceiptsDataTable({ data, totalRows, searchParams }: Props) {
  const router = useRouter();
  const [facets, setFacets] = useState<Record<string, { value: string; count: number }[]> | null>(
    null
  );

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [formReceiptId, setFormReceiptId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    getReceiptFacets().then(setFacets).catch(console.error);
  }, []);

  const columns = useMemo(
    () =>
      makeReceiptColumns({
        onView: (id) => {
          setDetailId(id);
          setDetailOpen(true);
        },
        onEdit: (id) => {
          setFormReceiptId(id);
          setFormOpen(true);
        },
      }),
    []
  );

  const facetedFilters = FILTER_CONFIG.map((filter) => {
    if (filter.type !== 'faceted' || !facets?.[filter.columnId]) return filter;
    const entries = facets[filter.columnId];
    return {
      ...filter,
      options: entries.map((f) => ({
        label: RECEIPT_STATUS_LABELS[f.value] ?? f.value,
        value: f.value,
      })),
      externalCounts: new Map(entries.map((f) => [f.value, f.count])),
    };
  });

  const handleNew = () => {
    setFormReceiptId(null);
    setFormOpen(true);
  };

  const handleSuccess = () => {
    router.refresh();
    getReceiptFacets().then(setFacets).catch(console.error);
  };

  return (
    <>
      <DataTable
        columns={columns as never}
        data={data as never}
        totalRows={totalRows}
        searchParams={searchParams}
        searchPlaceholder="Buscar por número o cliente..."
        facetedFilters={facetedFilters}
        tableId="sales-receipts"
        showFilterToggle
        emptyMessage="No hay recibos de cobro registrados."
        toolbarActions={
          <Button size="sm" onClick={handleNew}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo recibo
          </Button>
        }
      />

      <CreateReceiptModal
        open={formOpen}
        onOpenChange={setFormOpen}
        receiptId={formReceiptId}
        onSuccess={handleSuccess}
      />

      <ReceiptDetailModal receiptId={detailId} open={detailOpen} onOpenChange={setDetailOpen} />
    </>
  );
}
