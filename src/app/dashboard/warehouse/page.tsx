import WarehousesList from '@/modules/warehouse/features/list/components/WarehousesList';
import MovementsList from '@/modules/warehouse/features/movements/components/MovementsList';
import PageTableSkeleton from '@/shared/components/common/Skeletons/PageTableSkeleton';
import { buttonVariants } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { UrlTabs, UrlTabsContent, UrlTabsList, UrlTabsTrigger } from '@/shared/components/ui/url-tabs';
import Link from 'next/link';
import { Suspense } from 'react';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable';

const VALID_TABS = ['warehouses', 'movements'] as const;
type WarehouseTab = (typeof VALID_TABS)[number];

export default async function WarehousePage({
  searchParams,
}: {
  searchParams: Promise<DataTableSearchParams & { tab?: string }>;
}) {
  const resolved = await searchParams;
  const currentTab: WarehouseTab = VALID_TABS.includes(resolved.tab as WarehouseTab)
    ? (resolved.tab as WarehouseTab)
    : 'warehouses';

  return (
    <Suspense fallback={<PageTableSkeleton />}>
      <UrlTabs value={currentTab} paramName="tab" baseUrl="/dashboard/warehouse">
        <UrlTabsList>
          <UrlTabsTrigger value="warehouses">Almacenes</UrlTabsTrigger>
          <UrlTabsTrigger value="movements">Movimientos de stock</UrlTabsTrigger>
        </UrlTabsList>

        <UrlTabsContent value="warehouses">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Almacenes</CardTitle>
                <CardDescription>Gestión de almacenes y depósitos</CardDescription>
              </div>
              <Link href="/dashboard/warehouse/new" className={buttonVariants({ variant: 'default' })}>
                Nuevo almacén
              </Link>
            </CardHeader>
            <CardContent>
              <WarehousesList searchParams={resolved} />
            </CardContent>
          </Card>
        </UrlTabsContent>

        <UrlTabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle>Movimientos de stock</CardTitle>
              <CardDescription>Historial de todos los movimientos de inventario</CardDescription>
            </CardHeader>
            <CardContent>
              <MovementsList searchParams={resolved} />
            </CardContent>
          </Card>
        </UrlTabsContent>
      </UrlTabs>
    </Suspense>
  );
}
