import { redirect } from 'next/navigation';
import { getSession } from '@/shared/lib/session';
import { COSTOS_MODULE_NAME } from '@/modules/costos/shared/constants';

export default async function CostosLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session.hiredModules.includes(COSTOS_MODULE_NAME)) {
    redirect('/dashboard?error=modulo_no_habilitado');
  }

  return <>{children}</>;
}
