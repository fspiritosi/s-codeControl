'use client';

import { useQuery } from '@tanstack/react-query';
import { getMySupportTickets } from '../actions/support-tickets';
import type { MyTicketsData } from '../types';

export const MY_TICKETS_QUERY_KEY = ['ayuda', 'my-support-tickets'] as const;

export function useMyTickets(initialData?: MyTicketsData) {
  return useQuery({
    queryKey: MY_TICKETS_QUERY_KEY,
    queryFn: () => getMySupportTickets(),
    initialData,
    staleTime: 60_000,
  });
}
