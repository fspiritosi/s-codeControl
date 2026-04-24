import { Suspense } from 'react';
import PageTableSkeleton from '@/shared/components/common/Skeletons/PageTableSkeleton';
import { CashRegisterDetail } from '@/modules/treasury/features/cash-registers/components/CashRegisterDetail';

export default async function CashRegisterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="p-6">
      <Suspense fallback={<PageTableSkeleton />}>
        <CashRegisterDetail id={id} />
      </Suspense>
    </div>
  );
}
