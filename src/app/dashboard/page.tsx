import DashboardComponent from '@/components/Dashboard/DashboardComponent';
import DashboardSkeleton from '@/components/Skeletons/DashboardSkeleton';
import { Suspense } from 'react';

export default async function Home() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardComponent />
    </Suspense>
  );
}
