import { Suspense } from 'react';
import PageTableSkeleton from '@/shared/components/common/Skeletons/PageTableSkeleton';
import { PaymentOrderDetail } from '@/modules/treasury/features/payment-orders/components/PaymentOrderDetail';

export const dynamic = 'force-dynamic';

export default async function PaymentOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="p-6">
      <Suspense fallback={<PageTableSkeleton />}>
        <PaymentOrderDetail id={id} />
      </Suspense>
    </div>
  );
}
