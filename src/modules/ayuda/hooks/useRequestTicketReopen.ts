'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { requestSupportTicketReopen } from '../actions/support-reopen';
import { MY_TICKETS_QUERY_KEY } from './useMyTickets';
import { MY_TICKETS_PAGE_QUERY_KEY } from './useMyTicketsPage';
import { ticketDetailKey } from './useTicketDetail';
import { MY_TICKETS_WITH_UNREAD_QUERY_KEY } from './queryKeys';

export function useRequestTicketReopen(ticketId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { reason: string; attachmentKeys: string[] }) =>
      requestSupportTicketReopen(ticketId, input.reason, input.attachmentKeys),
    onSuccess: (updatedTicket) => {
      queryClient.setQueryData(ticketDetailKey(ticketId), updatedTicket);
      queryClient.invalidateQueries({ queryKey: MY_TICKETS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MY_TICKETS_WITH_UNREAD_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MY_TICKETS_PAGE_QUERY_KEY });
    },
  });
}
