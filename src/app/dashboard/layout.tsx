import { getMyTicketsWithUnread } from '@/modules/ayuda/actions/support-tickets';
import { MY_TICKETS_WITH_UNREAD_QUERY_KEY } from '@/modules/ayuda/hooks/queryKeys';
import NavBar from '@/shared/components/layout/NavBar';
import NotificationsAlert from '@/shared/components/layout/NotificationsAlert';
import SideBarContainer from '@/shared/components/layout/SideBarContainer';
import TanstackQueryProvider from '@/shared/providers/TanstackQueryProvider';
import { getRouteRule } from '@/shared/lib/route-permissions';
import { getSession } from '@/shared/lib/session';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
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

  // Prefetch server-side de los tickets sin leer para que el badge del sidebar
  // aparezca sin un fetch extra en cliente (se rehidrata vía HydrationBoundary).
  const queryClient = new QueryClient();
  try {
    await queryClient.prefetchQuery({
      queryKey: MY_TICKETS_WITH_UNREAD_QUERY_KEY,
      queryFn: () => getMyTicketsWithUnread(),
    });
  } catch {
    // Si el prefetch falla, el cliente reintenta vía useQuery
  }
  const dehydratedState = dehydrate(queryClient);

  return (
    <TanstackQueryProvider>
      <HydrationBoundary state={dehydratedState}>
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
      </HydrationBoundary>
    </TanstackQueryProvider>
  );
}
