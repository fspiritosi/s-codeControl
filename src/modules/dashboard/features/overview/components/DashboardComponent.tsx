import CardsGrid, { CardsGridSkeleton } from '@/modules/dashboard/features/overview/components/CardsGrid';
import { Suspense } from 'react';

export default async function DashboardComponent() {
  return (
    <section>
      <Suspense fallback={<CardsGridSkeleton />}>
        <CardsGrid />
      </Suspense>
    </section>
  );
}
