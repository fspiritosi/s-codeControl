import { Suspense } from 'react';
import { ReceiptsList } from '@/modules/sales/features/receipts';
import PageTableSkeleton from '@/shared/components/common/Skeletons/PageTableSkeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import type { DataTableSearchParams } from '@/shared/components/data-table/types';

export default async function SalesReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<DataTableSearchParams>;
}) {
  const resolved = await searchParams;

  return (
    <Suspense fallback={<PageTableSkeleton />}>
      <Card>
        <CardHeader>
          <CardTitle>Recibos de cobro</CardTitle>
          <CardDescription>
            Gestión de recibos de cobro de la empresa: aplicación a facturas, medios de pago y
            retenciones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReceiptsList searchParams={resolved} />
        </CardContent>
      </Card>
    </Suspense>
  );
}
