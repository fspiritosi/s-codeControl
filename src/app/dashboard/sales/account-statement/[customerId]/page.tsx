import { Suspense } from 'react';
import { notFound } from 'next/navigation';

import { getCustomerAccountStatement } from '@/modules/sales/features/account-statement/actions.server';
import { AccountStatementView } from '@/modules/sales/features/account-statement';
import PageTableSkeleton from '@/shared/components/common/Skeletons/PageTableSkeleton';

async function AccountStatementDetailContent({ customerId }: { customerId: string }) {
  const data = await getCustomerAccountStatement(customerId);

  if (!data) {
    notFound();
  }

  const { customer, movements, summary } = data;

  return (
    <AccountStatementView
      customer={{
        id: customer.id,
        name: customer.name,
        tax_id: customer.tax_id,
        cuit: customer.cuit != null ? String(customer.cuit) : null,
        tax_condition: customer.tax_condition,
      }}
      movements={movements}
      summary={summary}
    />
  );
}

export default async function SalesAccountStatementDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;

  return (
    <Suspense fallback={<PageTableSkeleton />}>
      <AccountStatementDetailContent customerId={customerId} />
    </Suspense>
  );
}
