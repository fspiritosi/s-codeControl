import DashboardComponent from '@/modules/dashboard/features/overview/components/DashboardComponent';
import DashboardSkeleton from '@/shared/components/common/Skeletons/DashboardSkeleton';
import { Suspense } from 'react';
import WelcomeComponent from '@/modules/dashboard/features/overview/components/welcome-component';
import { getRole } from '@/shared/lib/utils/getRole';

export default async function Home() {
  const role = await getRole();
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      {!role && <DashboardSkeleton />}
      {role === 'Invitado' && typeof role === 'string' ? <WelcomeComponent /> : <DashboardComponent />}
    </Suspense>
  );
}
