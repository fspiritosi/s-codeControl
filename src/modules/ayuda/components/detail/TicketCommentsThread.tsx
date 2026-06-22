'use client';

import { Lock, MessageSquare } from 'lucide-react';
import { TicketCommentsThreadSkeleton } from '../../fallback/TicketCommentsThreadSkeleton';
import { useTicketComments } from '../../hooks/useTicketComments';
import { TicketCommentComposer } from './TicketCommentComposer';
import { TicketCommentItem } from './TicketCommentItem';

interface Props {
  ticketId: number;
  currentUserEmail: string;
  currentUserName: string;
  isCompleted: boolean;
}

export function TicketCommentsThread({
  ticketId,
  currentUserEmail,
  currentUserName,
  isCompleted,
}: Props) {
  const { data: comments = [], isLoading } = useTicketComments(ticketId);

  return (
    <div className="space-y-3">
      {isLoading ? (
        <TicketCommentsThreadSkeleton />
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
          <MessageSquare className="h-6 w-6" />
          <p>Todavía no hay respuestas. Sé el primero en escribir.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id}>
              <TicketCommentItem
                comment={c}
                currentUserEmail={currentUserEmail}
                currentUserName={currentUserName}
              />
            </li>
          ))}
        </ul>
      )}

      {isCompleted ? (
        <div className="flex items-center gap-2 rounded-md border border-dashed bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          <span>Este ticket está cerrado. No se pueden agregar comentarios.</span>
        </div>
      ) : (
        <TicketCommentComposer ticketId={ticketId} currentUserEmail={currentUserEmail} />
      )}
    </div>
  );
}
