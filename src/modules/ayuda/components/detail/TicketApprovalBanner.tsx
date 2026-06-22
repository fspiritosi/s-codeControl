'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog';
import { Button } from '@/shared/components/ui/button';
import { Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { Ticket } from '@/shared/lib/taskapp/types';
import { useApproveTicket } from '../../hooks/useApproveTicket';
import { usePendingApproverTickets } from '../../hooks/useApproverTickets';
import { useRejectTicket } from '../../hooks/useRejectTicket';

interface Props {
  ticket: Ticket;
  currentUserEmail: string;
}

export function TicketApprovalBanner({ ticket, currentUserEmail }: Props) {
  void currentUserEmail;
  // Solo los aprobadores reales ven las acciones: el listado de pendientes lo
  // resuelve el backend validando el email contra el array de aprobadores del
  // proyecto (un no-aprobador recibe lista vacía). Un aprobador puede aprobar
  // cualquier ticket pendiente, incluso los creados por él mismo.
  const { data: pendingTickets = [] } = usePendingApproverTickets();
  const isApprover = pendingTickets.some((t) => t.id === ticket.id);
  const canApprove = isApprover && ticket.status?.slug === 'pendiente_aprobacion';

  const approve = useApproveTicket(ticket.id);
  const reject = useRejectTicket(ticket.id);

  if (!canApprove) return null;

  async function handleApprove() {
    try {
      await approve.mutateAsync();
      toast.success('Aprobación registrada.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al aprobar');
    }
  }

  async function handleReject() {
    try {
      await reject.mutateAsync();
      toast.success('Rechazo registrado.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al rechazar');
    }
  }

  const isBusy = approve.isPending || reject.isPending;

  return (
    <div className="border-b bg-amber-50 dark:bg-amber-950/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-amber-600" />
          <div>
            <p className="text-sm font-medium">Aprobá la valorización de este ticket</p>
            <p className="text-xs text-muted-foreground">
              El equipo valorizó este ticket. Aprobá para que pase a planificación, o rechazalo si no corresponde.
            </p>
            {ticket.estimated_hours != null && (
              <p className="mt-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                Horas valorizadas: {ticket.estimated_hours} h
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={isBusy}>
                Rechazar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Confirmás que rechazás este ticket?</AlertDialogTitle>
                <AlertDialogDescription>
                  Al rechazar, el ticket queda cancelado y el equipo no avanzará con él.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleReject}>Rechazar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button size="sm" onClick={handleApprove} disabled={isBusy}>
            {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Aprobar
          </Button>
        </div>
      </div>
    </div>
  );
}
