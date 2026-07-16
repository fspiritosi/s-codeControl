'use client';

import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Clock, ListChecks, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { parseCategoryFromTitle } from '../constants/categories';
import { statusFor } from '../constants/ticket-status';
import { ApproverAllTicketsSkeleton } from '../fallback/ApproverAllTicketsSkeleton';
import { APPROVER_ALL_PAGE_SIZE, useApproverTicketsPage } from '../hooks/useApproverTickets';
import { PageFetchBar, PaginationNav } from './PaginationNav';
import { TicketPriorityBadge } from './TicketPriorityBadge';

interface Props {
  /** Abre el detalle del ticket (mismo handler que la lista principal). */
  onSelect?: (id: number) => void;
}

/**
 * Vista auditora del aprobador: TODOS los tickets del proyecto (de todos los
 * usuarios) con quién los generó, estado y prioridad. Paginación server-side,
 * más recientes primero. El backend decide qué incluye (externos + internos
 * valorizados) y solo responde a aprobadores; para el resto la lista viene
 * vacía y el panel no se renderiza.
 */
export function ApproverAllTickets({ onSelect }: Props) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isPlaceholderData } = useApproverTicketsPage(page);

  const tickets = data?.tickets ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / APPROVER_ALL_PAGE_SIZE));

  // Si el total baja (se borraron tickets), corregimos la página actual.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Primera carga: skeleton con las mismas dimensiones que el panel real.
  if (isLoading) return <ApproverAllTicketsSkeleton />;

  if (total === 0) return null;

  const showPagination = total > APPROVER_ALL_PAGE_SIZE;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-muted-foreground" />
          Todos los tickets del proyecto
          <Badge variant="secondary" className="font-medium">
            {total}
          </Badge>
        </CardTitle>
        <CardDescription>
          Vista de aprobador: reportes de todos los usuarios y quién los generó.
        </CardDescription>
      </CardHeader>
      <PageFetchBar active={isPlaceholderData} />
      <CardContent className="divide-y p-0">
        {/* Durante la transición de página los datos salientes quedan atenuados
            y sin interacción; key={page} monta la entrante con fade-in. */}
        <div
          key={page}
          aria-busy={isPlaceholderData}
          className={`divide-y animate-in fade-in-25 duration-300 transition-[opacity,filter] ${
            isPlaceholderData ? 'pointer-events-none opacity-50 saturate-50' : ''
          }`}
        >
        {tickets.map((ticket) => {
          const status = statusFor(ticket.status?.slug, ticket.status?.name);
          const { cleanTitle, categoryLabel } = parseCategoryFromTitle(ticket.title);
          const reporterLabel =
            ticket.reporter_name && ticket.reporter_name.trim() !== ''
              ? ticket.reporter_name
              : (ticket.reporter_email ?? 'Desconocido');

          return (
            <button
              key={ticket.id}
              type="button"
              onClick={() => onSelect?.(ticket.id)}
              className="flex w-full cursor-pointer flex-wrap items-center justify-between gap-3 px-6 py-3.5 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex h-2 w-2 shrink-0 rounded-full ${status.dotClass}`} />
                  <p className="truncate text-sm font-medium">
                    TKT-{ticket.id} · {cleanTitle}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {reporterLabel}
                  </span>
                  {categoryLabel && <span>{categoryLabel}</span>}
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(ticket.created_at), { locale: es, addSuffix: true })}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <TicketPriorityBadge slug={ticket.priority} />
                <Badge variant="outline" className={`border-transparent ${status.badgeClass}`}>
                  {status.label}
                </Badge>
              </div>
            </button>
          );
        })}
        </div>

        {showPagination && (
          <PaginationNav
            page={page}
            total={total}
            pageSize={APPROVER_ALL_PAGE_SIZE}
            onPageChange={setPage}
            isFetching={isPlaceholderData}
            ariaLabel="Paginación de tickets del proyecto"
            className="px-6 py-3"
          />
        )}
      </CardContent>
    </Card>
  );
}
