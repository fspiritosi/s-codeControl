'use client';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useQueryClient } from '@tanstack/react-query';
import { Clock, Loader2, ShieldCheck, Tag, User } from 'lucide-react';
import moment from 'moment';
import 'moment/locale/es';
import { toast } from 'sonner';
import type { Ticket } from '@/shared/lib/taskapp/types';
import { parseCategoryFromTitle } from '../constants/categories';
import { ApproverInboxSkeleton } from '../fallback/ApproverInboxSkeleton';
import { useApproveTicket } from '../hooks/useApproveTicket';
import { usePendingApproverTickets, APPROVER_TICKETS_QUERY_KEY } from '../hooks/useApproverTickets';
import { useRejectTicket } from '../hooks/useRejectTicket';
import { TicketPriorityBadge } from './TicketPriorityBadge';

interface Props {
  /** Abre el detalle del ticket (mismo handler que la lista principal). */
  onSelect?: (id: number) => void;
}

/**
 * Bandeja del aprobador: lista los tickets pendientes de aprobación del cliente.
 * No renderiza nada si el usuario no es aprobador o no hay nada pendiente, así que
 * es seguro montarla siempre dentro del Centro de Ayuda.
 */
export function ApproverInbox({ onSelect }: Props) {
  const { data: pending = [], isLoading } = usePendingApproverTickets();

  // Primera carga: skeleton con las mismas dimensiones que la bandeja real.
  if (isLoading) return <ApproverInboxSkeleton />;

  if (pending.length === 0) return null;

  return (
    <Card className="overflow-hidden border-l-4 border-l-yellow-500">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-yellow-600" />
          Pendientes de tu aprobación
          <Badge variant="secondary" className="font-medium">
            {pending.length}
          </Badge>
        </CardTitle>
        <CardDescription>
          Aprobá o rechazá estos tickets para que el equipo pueda avanzar.
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y p-0">
        {pending.map((ticket) => (
          <ApproverRow key={ticket.id} ticket={ticket} onSelect={onSelect} />
        ))}
      </CardContent>
    </Card>
  );
}

function ApproverRow({ ticket, onSelect }: { ticket: Ticket; onSelect?: (id: number) => void }) {
  const queryClient = useQueryClient();
  const approve = useApproveTicket(ticket.id);
  const reject = useRejectTicket(ticket.id);
  const isBusy = approve.isPending || reject.isPending;

  function refresh() {
    queryClient.invalidateQueries({ queryKey: APPROVER_TICKETS_QUERY_KEY });
  }

  async function handleApprove() {
    try {
      await approve.mutateAsync();
      toast.success('Aprobación registrada.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al aprobar');
    } finally {
      // Refrescar siempre: si otro aprobador ya resolvió el ticket (carrera),
      // el pendiente desaparece de la bandeja igual.
      refresh();
    }
  }

  async function handleReject() {
    try {
      await reject.mutateAsync();
      toast.success('Rechazo registrado.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al rechazar');
    } finally {
      refresh();
    }
  }

  const { cleanTitle, categoryLabel, categoryDef } = parseCategoryFromTitle(ticket.title);
  const CategoryIcon = categoryDef?.icon ?? Tag;
  const reporterLabel =
    ticket.reporter_name && ticket.reporter_name.trim() !== ''
      ? ticket.reporter_name
      : (ticket.reporter_email ?? 'Desconocido');

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
      <button
        type="button"
        onClick={() => onSelect?.(ticket.id)}
        className="min-w-0 flex-1 cursor-pointer space-y-1.5 rounded-md text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2 w-2 shrink-0 rounded-full bg-yellow-500" />
          <p className="truncate text-sm font-semibold">
            TKT-{ticket.id} · {cleanTitle}
          </p>
        </div>
        {ticket.description && (
          <p className="line-clamp-1 text-xs text-muted-foreground">{ticket.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <User className="h-3 w-3" />
            {reporterLabel}
          </span>
          {categoryLabel && (
            <span className="inline-flex items-center gap-1">
              <CategoryIcon className="h-3 w-3" />
              {categoryLabel}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {moment(ticket.created_at).locale('es').fromNow()}
          </span>
          {ticket.estimated_hours != null && (
            <span className="inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400">
              <Clock className="h-3 w-3" />
              {ticket.estimated_hours} h valorizadas
            </span>
          )}
        </div>
      </button>
      <div className="flex shrink-0 items-center gap-2">
        <TicketPriorityBadge slug={ticket.priority} />
        <Button variant="outline" size="sm" onClick={handleReject} disabled={isBusy}>
          Rechazar
        </Button>
        <Button size="sm" onClick={handleApprove} disabled={isBusy}>
          {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Aprobar
        </Button>
      </div>
    </div>
  );
}
