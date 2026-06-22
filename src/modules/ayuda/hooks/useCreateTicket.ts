'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSupportTicket } from '../actions/support-tickets';
import { APPROVER_TICKETS_QUERY_KEY } from './useApproverTickets';
import { MY_TICKETS_QUERY_KEY } from './useMyTickets';
import { MY_TICKETS_PAGE_QUERY_KEY } from './useMyTicketsPage';
import { MY_TICKETS_WITH_UNREAD_QUERY_KEY } from './useMyTicketsWithUnread';

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSupportTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_TICKETS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MY_TICKETS_PAGE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MY_TICKETS_WITH_UNREAD_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: APPROVER_TICKETS_QUERY_KEY });
    },
  });
}
