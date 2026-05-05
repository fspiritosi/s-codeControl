import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import SupplierDetail from '@/modules/suppliers/features/detail/components/SupplierDetail';
import { getSupplierById } from '@/modules/suppliers/features/list/actions.server';
import AccountStatementTab from '@/modules/suppliers/features/account-statement/components/AccountStatementTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Skeleton } from '@/shared/components/ui/skeleton';

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supplier = await getSupplierById(id);

  if (!supplier) return notFound();

  return (
    <div className="max-w-5xl">
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="account">Cuenta corriente</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <SupplierDetail supplier={supplier as any} />
        </TabsContent>
        <TabsContent value="account">
          <Suspense fallback={<AccountStatementSkeleton />}>
            <AccountStatementTab supplierId={id} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AccountStatementSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}
