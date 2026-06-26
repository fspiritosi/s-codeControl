'use client';

import { useQuery } from '@tanstack/react-query';
import { getMyTicketsWithUnread } from '../actions/support-tickets';
import type { TicketWithUnread } from '@/shared/lib/taskapp/types';
import { MY_TICKETS_WITH_UNREAD_QUERY_KEY } from './queryKeys';

export { MY_TICKETS_WITH_UNREAD_QUERY_KEY };

export function useMyTicketsWithUnread(initialData?: TicketWithUnread[]) {
  return useQuery({
    queryKey: MY_TICKETS_WITH_UNREAD_QUERY_KEY,
    queryFn: () => getMyTicketsWithUnread(),
    staleTime: 60_000,
    // Polling del badge global (sidebar). Reemplaza al SSE: refresca novedades
    // sin mantener una conexión persistente. Por defecto NO pollea con la
    // pestaña en segundo plano (refetchIntervalInBackground: false).
    refetchInterval: 60_000,
    initialData,
  });
}
