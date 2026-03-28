import PurchaseOrdersList from '@/modules/purchasing/features/purchase-orders/list/components/PurchaseOrdersList';
import PageTableSkeleton from '@/shared/components/common/Skeletons/PageTableSkeleton';
import { buttonVariants } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { UrlTabs, UrlTabsContent, UrlTabsList, UrlTabsTrigger } from '@/shared/components/ui/url-tabs';
import Link from 'next/link';
import { Suspense } from 'react';
import type { DataTableSearchParams } from '@/shared/components/common/DataTable';

const VALID_TABS = ['orders', 'invoices', 'receiving'] as const;
type PurchasingTab = (typeof VALID_TABS)[number];

export default async function PurchasingPage({
  searchParams,
}: {
  searchParams: Promise<DataTableSearchParams & { tab?: string }>;
}) {
  const resolved = await searchParams;
  const currentTab: PurchasingTab = VALID_TABS.includes(resolved.tab as PurchasingTab)
    ? (resolved.tab as PurchasingTab)
    : 'orders';

  return (
    <Suspense fallback={<PageTableSkeleton />}>
      <UrlTabs value={currentTab} paramName="tab" baseUrl="/dashboard/purchasing">
        <UrlTabsList>
          <UrlTabsTrigger value="orders">Órdenes de compra</UrlTabsTrigger>
          <UrlTabsTrigger value="invoices">Facturas</UrlTabsTrigger>
          <UrlTabsTrigger value="receiving">Remitos de recepción</UrlTabsTrigger>
        </UrlTabsList>

        <UrlTabsContent value="orders">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Órdenes de compra</CardTitle>
                <CardDescription>Gestión de órdenes de compra a proveedores</CardDescription>
              </div>
              <Link href="/dashboard/purchasing/orders/new" className={buttonVariants({ variant: 'default' })}>
                Nueva orden
              </Link>
            </CardHeader>
            <CardContent>
              <PurchaseOrdersList searchParams={resolved} />
            </CardContent>
          </Card>
        </UrlTabsContent>

        <UrlTabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Facturas de compra</CardTitle>
              <CardDescription>Próximamente</CardDescription>
            </CardHeader>
          </Card>
        </UrlTabsContent>

        <UrlTabsContent value="receiving">
          <Card>
            <CardHeader>
              <CardTitle>Remitos de recepción</CardTitle>
              <CardDescription>Próximamente</CardDescription>
            </CardHeader>
          </Card>
        </UrlTabsContent>
      </UrlTabs>
    </Suspense>
  );
}
