'use client';

import { Button } from '@/shared/components/ui/button';
import type { Ticket } from '@/shared/lib/taskapp/types';
import { Clock, RotateCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { TicketReopenRequestDialog } from './TicketReopenRequestDialog';

const TERMINAL_STATUSES = new Set(['resolved', 'done', 'closed']);

interface Props {
  ticket: Ticket;
  currentUserEmail: string;
}

export function TicketReopenRequestBanner({ ticket, currentUserEmail }: Props) {
  const [open, setOpen] = useState(false);

  const isReporter = ticket.reporter_email === currentUserEmail;
  if (!isReporter) return null;

  if (ticket.reopen_status === 'pending' && ticket.reopen_requested_at) {
    return (
      <div className="border-b bg-amber-50 dark:bg-amber-950/40 p-4">
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium">Solicitud de reapertura enviada</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(ticket.reopen_requested_at), { locale: es, addSuffix: true })} — un agente la va a
              revisar y te avisamos.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isTerminal = ticket.status != null && TERMINAL_STATUSES.has(ticket.status.slug);
  const canRequest = isTerminal && ticket.reopen_status == null;
  if (!canRequest) return null;

  return (
    <>
      <div className="border-b bg-emerald-50 dark:bg-emerald-950/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <RotateCcw className="mt-0.5 h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-sm font-medium">¿Necesitás reabrir este ticket?</p>
              <p className="text-xs text-muted-foreground">
                Contanos por qué y agregá evidencia si la tenés.
              </p>
            </div>
          </div>
          <Button size="sm" onClick={() => setOpen(true)}>
            Solicitar reapertura
          </Button>
        </div>
      </div>
      <TicketReopenRequestDialog ticketId={ticket.id} open={open} onOpenChange={setOpen} />
    </>
  );
}
