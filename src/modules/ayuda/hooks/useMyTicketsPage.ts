'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { TicketWithUnread } from '@/shared/lib/taskapp/types';
import { getMyTicketsPageWithUnread, type MyTicketsPage } from '../actions/support-tickets';

/** Prefijo: invalidarlo refresca todas las páginas de "Mis tickets". */
export const MY_TICKETS_PAGE_QUERY_KEY = ['ayuda', 'my-tickets-page'];

export const MY_TICKETS_PAGE_SIZE = 4;

const RESOLVED_SLUGS = new Set(['resolved', 'done', 'closed', 'cancelled']);

/**
 * Página de "Mis tickets" (server-side, más recientes primero) con no-leídos.
 * `initialTickets` (la lista del SSR de la page) siembra la página 1 para que
 * el primer render no muestre skeleton.
 */
export function useMyTicketsPage(page: number, initialTickets?: TicketWithUnread[]) {
  return useQuery({
    queryKey: [...MY_TICKETS_PAGE_QUERY_KEY, page],
    queryFn: () => getMyTicketsPageWithUnread(page, MY_TICKETS_PAGE_SIZE),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    initialData:
      page === 1 && initialTickets
        ? ({
            tickets: initialTickets.slice(0, MY_TICKETS_PAGE_SIZE),
            total: initialTickets.length,
            completed: initialTickets.filter((t) => {
              const slug = t.status?.slug;
              return !!slug && RESOLVED_SLUGS.has(slug);
            }).length,
          } satisfies MyTicketsPage)
        : undefined,
  });
}
