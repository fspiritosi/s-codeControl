import { Suspense } from 'react';
import PageTableSkeleton from '@/shared/components/common/Skeletons/PageTableSkeleton';
import { NewPaymentOrderShell } from '@/modules/treasury/features/payment-orders/components/NewPaymentOrderShell';

export default async function NewPaymentOrderPage() {
  return (
    <div className="p-6">
      <Suspense fallback={<PageTableSkeleton />}>
        <NewPaymentOrderShell />
      </Suspense>
    </div>
  );
}
