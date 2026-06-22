import type { Ticket } from '@/shared/lib/taskapp/types';
import { TicketAttachmentsList } from './TicketAttachmentsList';
import { TicketCommentsThread } from './TicketCommentsThread';

const COMPLETED_STATUSES = new Set(['resolved', 'done', 'closed', 'cancelled']);

interface Props {
  ticket: Ticket;
  currentUserEmail: string;
  currentUserName: string;
}

export function TicketDetailBody({ ticket, currentUserEmail, currentUserName }: Props) {
  const isCompleted = ticket.status != null && COMPLETED_STATUSES.has(ticket.status.slug);

  return (
    <div className="space-y-6 p-6">
      {ticket.description && (
        <section>
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">Descripción</h4>
          <p className="whitespace-pre-wrap text-sm text-foreground">{ticket.description}</p>
        </section>
      )}

      <TicketAttachmentsList urls={ticket.attachments ?? []} />

      <section>
        <h4 className="mb-3 text-sm font-medium text-muted-foreground">Conversación</h4>
        <TicketCommentsThread
          ticketId={ticket.id}
          currentUserEmail={currentUserEmail}
          currentUserName={currentUserName}
          isCompleted={isCompleted}
        />
      </section>
    </div>
  );
}
