import SuppliersList from '@/modules/suppliers/features/list/components/SuppliersList';
import PageTableSkeleton from '@/shared/components/common/Skeletons/PageTableSkeleton';
import { buttonVariants } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import Link from 'next/link';
import { Suspense } from 'react';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable';

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<DataTableSearchParams>;
}) {
  const resolved = await searchParams;

  return (
    <Suspense fallback={<PageTableSkeleton />}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Proveedores</CardTitle>
            <CardDescription>Gestión de proveedores de la empresa</CardDescription>
          </div>
          <Link href="/dashboard/suppliers/new" className={buttonVariants({ variant: 'default' })}>
            Nuevo proveedor
          </Link>
        </CardHeader>
        <CardContent>
          <SuppliersList searchParams={resolved} />
        </CardContent>
      </Card>
    </Suspense>
  );
}
