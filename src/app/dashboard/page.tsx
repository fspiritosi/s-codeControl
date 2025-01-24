import DashboardComponent from '@/components/Dashboard/DashboardComponent';
import DashboardSkeleton from '@/components/Skeletons/DashboardSkeleton';
import { supabaseServer } from '@/lib/supabase/server';
import { getActualRole } from '@/lib/utils';
import { Suspense } from 'react';
import { fetchCurrentCompany } from '../server/GET/actions';
import WelcomeComponent from './welcome-component';

export default async function Home() {
  const supabase = supabaseServer();
  const currentCompany = await fetchCurrentCompany();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = await getActualRole(currentCompany[0]?.id as string, user?.id as string);
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      {!role && <DashboardSkeleton />}
      {role === 'Invitado' && typeof role === 'string' ? <WelcomeComponent /> : <DashboardComponent />}
    </Suspense>
  );
}
