'use client';

import { useQuery } from '@tanstack/react-query';
import type { Ticket } from '@/shared/lib/taskapp/types';
import { getSupportTicketById } from '../actions/support-tickets';

export const ticketDetailKey = (id: number) => ['ayuda', 'ticket', id] as const;

export function useTicketDetail(id: number | null, initialData?: Ticket | null) {
  return useQuery({
    queryKey: id == null ? ['ayuda', 'ticket', 'none'] : ticketDetailKey(id),
    queryFn: () => (id == null ? Promise.resolve(null) : getSupportTicketById(id)),
    initialData: id == null ? null : initialData ?? undefined,
    enabled: id != null,
    staleTime: 30_000,
  });
}
