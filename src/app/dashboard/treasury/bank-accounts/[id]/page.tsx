import { Suspense } from 'react';
import PageTableSkeleton from '@/shared/components/common/Skeletons/PageTableSkeleton';
import { BankAccountDetail } from '@/modules/treasury/features/bank-accounts/components/BankAccountDetail';

export default async function BankAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="p-6">
      <Suspense fallback={<PageTableSkeleton />}>
        <BankAccountDetail id={id} />
      </Suspense>
    </div>
  );
}
