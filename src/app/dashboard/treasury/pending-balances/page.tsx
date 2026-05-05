import { Suspense } from 'react';
import PageTableSkeleton from '@/shared/components/common/Skeletons/PageTableSkeleton';
import {
  listPendingInvoices,
  getSuppliersWithPendingInvoices,
  PendingBalancesView,
} from '@/modules/treasury/features/pending-balances';

interface PageProps {
  searchParams: Promise<{
    supplier?: string;
    op_status?: string;
    search?: string;
    page?: string;
  }>;
}

async function PendingBalancesContent({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = sp.page ? Math.max(1, parseInt(sp.page, 10) || 1) : 1;
  const pageSize = 25;
  const opStatus =
    sp.op_status === 'NONE' || sp.op_status === 'SCHEDULED' ? sp.op_status : null;

  const [result, suppliers] = await Promise.all([
    listPendingInvoices({
      supplier_id: sp.supplier ?? null,
      op_status: opStatus,
      search: sp.search ?? null,
      page,
      pageSize,
    }),
    getSuppliersWithPendingInvoices(),
  ]);

  return (
    <PendingBalancesView
      rows={result.rows}
      total={result.total}
      summary={result.summary}
      suppliers={suppliers}
      page={page}
      pageSize={pageSize}
      initialFilters={{
        supplier_id: sp.supplier,
        op_status: sp.op_status,
        search: sp.search,
      }}
    />
  );
}

export default function PendingBalancesPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<PageTableSkeleton />}>
      <PendingBalancesContent searchParams={searchParams} />
    </Suspense>
  );
}
