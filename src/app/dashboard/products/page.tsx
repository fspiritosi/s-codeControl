import ProductsList from '@/modules/products/features/list/components/ProductsList';
import PageTableSkeleton from '@/shared/components/common/Skeletons/PageTableSkeleton';
import { buttonVariants } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import Link from 'next/link';
import { Suspense } from 'react';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable';

export default async function ProductsPage({
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
            <CardTitle>Productos</CardTitle>
            <CardDescription>Catálogo de productos, servicios y materiales</CardDescription>
          </div>
          <Link href="/dashboard/products/new" className={buttonVariants({ variant: 'default' })}>
            Nuevo producto
          </Link>
        </CardHeader>
        <CardContent>
          <ProductsList searchParams={resolved} />
        </CardContent>
      </Card>
    </Suspense>
  );
}
