'use client';

import { Sheet, SheetContent } from '@/shared/components/ui/sheet';
import type { Ticket } from '@/shared/lib/taskapp/types';
import { Inbox } from 'lucide-react';
import { useEffect } from 'react';
import { TicketDetailSheetSkeleton } from '../../fallback/TicketDetailSheetSkeleton';
import { useMarkTicketAsReadMutation } from '../../hooks/useMarkTicketAsReadMutation';
import { useTicketDetail } from '../../hooks/useTicketDetail';
import { TicketApprovalBanner } from './TicketApprovalBanner';
import { TicketDetailBody } from './TicketDetailBody';
import { TicketDetailHeader } from './TicketDetailHeader';
import { TicketReopenRequestBanner } from './TicketReopenRequestBanner';

interface Props {
  ticketId: number | null;
  initialTicket: Ticket | null;
  currentUserEmail: string;
  currentUserName: string;
  onClose: () => void;
}

export default function TicketDetailSheet({
  ticketId,
  initialTicket,
  currentUserEmail,
  currentUserName,
  onClose,
}: Props) {
  const open = ticketId != null;
  const initial = initialTicket && initialTicket.id === ticketId ? initialTicket : null;
  const { data: ticket, isLoading } = useTicketDetail(ticketId, initial);
  const markAsReadMutation = useMarkTicketAsReadMutation();

  // Marcar el ticket como leido cuando se abre el sheet (fire-and-forget)
  useEffect(() => {
    if (ticketId != null) {
      markAsReadMutation.mutate(ticketId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="sm:max-w-2xl flex flex-col p-0 gap-0">
        {isLoading && !ticket ? (
          <TicketDetailSheetSkeleton />
        ) : ticket ? (
          <>
            <div className="shrink-0">
              <TicketDetailHeader ticket={ticket} />
              <TicketApprovalBanner ticket={ticket} currentUserEmail={currentUserEmail} />
              <TicketReopenRequestBanner ticket={ticket} currentUserEmail={currentUserEmail} />
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              <TicketDetailBody
                ticket={ticket}
                currentUserEmail={currentUserEmail}
                currentUserName={currentUserName}
              />
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium">Ticket no encontrado o sin acceso</p>
            <p className="text-xs text-muted-foreground">
              Puede que el ticket haya sido eliminado o que no tengas permiso para verlo.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
