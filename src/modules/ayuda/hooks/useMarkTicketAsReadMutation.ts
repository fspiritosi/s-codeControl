'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markSupportTicketAsRead } from '../actions/support-ticket-views';
import { MY_TICKETS_PAGE_QUERY_KEY } from './useMyTicketsPage';
import { MY_TICKETS_WITH_UNREAD_QUERY_KEY } from './useMyTicketsWithUnread';

export function useMarkTicketAsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: number) => markSupportTicketAsRead(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_TICKETS_WITH_UNREAD_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MY_TICKETS_PAGE_QUERY_KEY });
    },
  });
}
