'use client';

import { useQuery } from '@tanstack/react-query';
import { listSupportTicketComments } from '../actions/support-comments';

export const ticketCommentsKey = (id: number) => ['ayuda', 'ticket', id, 'comments'] as const;

export function useTicketComments(id: number | null) {
  return useQuery({
    queryKey: id == null ? ['ayuda', 'ticket', 'none', 'comments'] : ticketCommentsKey(id),
    queryFn: () => (id == null ? Promise.resolve([]) : listSupportTicketComments(id)),
    enabled: id != null,
    staleTime: 15_000,
  });
}
