import DashboardComponent from '@/components/Dashboard/DashboardComponent';
import DashboardSkeleton from '@/components/Skeletons/DashboardSkeleton';
import { Suspense } from 'react';
import WelcomeComponent from './welcome-component';
import { getRole } from '@/lib/utils/getRole';

export default async function Home() {
  const role = await getRole();
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      {!role && <DashboardSkeleton />}
      {role === 'Invitado' && typeof role === 'string' ? <WelcomeComponent /> : <DashboardComponent />}
    </Suspense>
  );
}
