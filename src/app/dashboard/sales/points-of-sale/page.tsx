import { Suspense } from 'react';

import { getSalesPointsOfSale } from '@/modules/sales/features/points-of-sale/actions.server';
import { PointsOfSaleList } from '@/modules/sales/features/points-of-sale';
import PageTableSkeleton from '@/shared/components/common/Skeletons/PageTableSkeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';

async function PointsOfSaleContent() {
  const data = await getSalesPointsOfSale();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Puntos de venta</CardTitle>
        <CardDescription>
          Gestión de puntos de venta y numeración de comprobantes de la empresa.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PointsOfSaleList data={data} />
      </CardContent>
    </Card>
  );
}

export default function SalesPointsOfSalePage() {
  return (
    <Suspense fallback={<PageTableSkeleton />}>
      <PointsOfSaleContent />
    </Suspense>
  );
}
