import NavBar from '@/shared/components/layout/NavBar';
import NotificationsAlert from '@/shared/components/layout/NotificationsAlert';
import SideBarContainer from '@/shared/components/layout/SideBarContainer';
import TanstackQueryProvider from '@/shared/providers/TanstackQueryProvider';
import { getRouteRule } from '@/shared/lib/route-permissions';
import { getSession } from '@/shared/lib/session';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import '../globals.css';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const hdrs = await headers();
  const pathname = hdrs.get('x-pathname') ?? '';

  const rule = getRouteRule(pathname);
  if (rule) {
    const session = await getSession();
    const granted = new Set(session.permissions);
    const isOwner = session.role === 'owner';
    if (!isOwner && !granted.has(rule.permission)) {
      redirect(
        `/dashboard/no-access?permission=${encodeURIComponent(rule.permission)}${
          rule.module ? `&module=${encodeURIComponent(rule.module)}` : ''
        }`
      );
    }
  }

  // NOTA: antes acá se hacía `await queryClient.prefetchQuery(getMyTicketsWithUnread)`
  // para el badge del sidebar. Eso llamaba a la API EXTERNA de TaskApp (fetch) y
  // BLOQUEABA el render del layout — y por ende de TODA página del dashboard — hasta
  // que esa API respondiera (en local no se notaba porque TASKAPP_BASE_URL no está
  // seteado y devolvía []). El badge no es crítico: el hook `useMyTicketsWithUnread`
  // lo carga en cliente sin bloquear el render inicial.

  return (
    <TanstackQueryProvider>
      <div className={`grid grid-rows-[auto,1fr] grid-cols-[auto,1fr] h-screen `}>
        <div className="row-span-2 ">
          <SideBarContainer />
        </div>
        <div className="border-r border-b border-muted/50">
          <NavBar />
        </div>
        <div className="overflow-y-auto">
          <div className="animate-fade-in px-6 pb-6 space-y-4">
            <Suspense fallback={null}>
              <NotificationsAlert />
            </Suspense>
            {children}
          </div>
        </div>
      </div>
    </TanstackQueryProvider>
  );
}
