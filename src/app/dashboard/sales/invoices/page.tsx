import { Suspense } from 'react';
import Link from 'next/link';
import InvoicesList from '@/modules/sales/features/invoices/list/components/InvoicesList';
import PageTableSkeleton from '@/shared/components/common/Skeletons/PageTableSkeleton';
import { buttonVariants } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import type { DataTableSearchParams } from '@/shared/components/data-table/types';

export default async function SalesInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<DataTableSearchParams>;
}) {
  const resolved = await searchParams;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Facturas de venta</CardTitle>
          <CardDescription>Emisión de comprobantes de venta a clientes</CardDescription>
        </div>
        <Link href="/dashboard/sales/invoices/new" className={buttonVariants({ variant: 'default' })}>
          Nueva factura
        </Link>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<PageTableSkeleton />}>
          <InvoicesList searchParams={resolved} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
