'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Comment } from '@/shared/lib/taskapp/types';
import { createSupportTicketComment } from '../actions/support-comments';
import { ticketCommentsKey } from './useTicketComments';

export function useCreateComment(ticketId: number, authorEmail: string) {
  const queryClient = useQueryClient();
  const key = ticketCommentsKey(ticketId);

  return useMutation({
    mutationFn: (body: string) =>
      createSupportTicketComment({ ticketId, body }),

    onMutate: async (body: string) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Comment[]>(key) ?? [];
      const optimistic: Comment = {
        id: -Date.now(),
        task_id: ticketId,
        author_email: authorEmail,
        body: body.trim(),
        is_internal: false,
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData<Comment[]>(key, [...previous, optimistic]);
      return { previous };
    },

    onError: (_err, _body, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(key, ctx.previous);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
