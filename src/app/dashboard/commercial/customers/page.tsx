import { Suspense } from 'react';
import Link from 'next/link';
import Customers from '@/modules/commercial/features/customers/components/Customers';
import { buttonVariants } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import PageTableSkeleton from '@/shared/components/common/Skeletons/PageTableSkeleton';

export default function CommercialCustomersPage() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Clientes</CardTitle>
          <CardDescription>Gestión de clientes, sus servicios e ítems</CardDescription>
        </div>
        <Link
          href="/dashboard/commercial/customers/action?action=new"
          className={buttonVariants({ variant: 'default' })}
        >
          Registrar Cliente
        </Link>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<PageTableSkeleton />}>
          <Customers />
        </Suspense>
      </CardContent>
    </Card>
  );
}
