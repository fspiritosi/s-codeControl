'use client';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { CheckCircle2, Clock, HelpCircle, Inbox, Loader2, RefreshCcw } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Ticket, TicketWithUnread } from '@/shared/lib/taskapp/types';
import { useMyTicketsPage } from '../hooks/useMyTicketsPage';
import { ApproverAllTickets } from './ApproverAllTickets';
import { ApproverInbox } from './ApproverInbox';
import { MyTicketsList } from './MyTicketsList';
import { TicketForm } from './TicketForm';

const TicketDetailSheet = dynamic(() => import('./detail/TicketDetailSheet'), { ssr: false });

interface Stats {
  total: number;
  active: number;
  resolved: number;
}

interface Props {
  initialTickets: TicketWithUnread[];
  initialTicket: Ticket | null;
  initialTicketId: number | null;
  currentUserEmail: string;
  currentUserName: string;
}

export function HelpCenter({
  initialTickets,
  initialTicket,
  initialTicketId,
  currentUserEmail,
  currentUserName,
}: Props) {
  const searchParams = useSearchParams();

  // "Mis tickets" paginado server-side; los totales del backend alimentan las
  // estadísticas del hero sin traer toda la lista.
  const [myPage, setMyPage] = useState(1);
  const {
    data: myTicketsPage,
    isLoading: myTicketsLoading,
    isFetching,
    isPlaceholderData: myTicketsTransition,
    refetch,
  } = useMyTicketsPage(myPage, initialTickets);
  const tickets = myTicketsPage?.tickets ?? [];
  const ticketsTotal = myTicketsPage?.total ?? 0;
  const ticketsCompleted = myTicketsPage?.completed ?? 0;
  const stats: Stats = {
    total: ticketsTotal,
    active: Math.max(0, ticketsTotal - ticketsCompleted),
    resolved: ticketsCompleted,
  };

  // Al crear un ticket nuevo (sube el total), volvemos a página 1 para que el
  // usuario lo vea primerito.
  const prevTotal = useRef(ticketsTotal);
  useEffect(() => {
    if (ticketsTotal > prevTotal.current && myPage !== 1) setMyPage(1);
    prevTotal.current = ticketsTotal;
  }, [ticketsTotal, myPage]);

  // Estado local para apertura instantánea del Sheet — mismo patrón que TabsManagerClient.
  // Evita el round-trip al server cada vez que el usuario clickea una card.
  const getInitialId = (): number | null => {
    const param = searchParams.get('ticket');
    if (!param) return initialTicketId;
    const n = Number(param);
    return Number.isFinite(n) ? n : null;
  };

  const [activeTicketId, setActiveTicketId] = useState<number | null>(getInitialId);

  // Sincronizar SOLO si la URL cambia externamente (back/forward del browser).
  useEffect(() => {
    const param = searchParams.get('ticket');
    const n = param ? Number(param) : null;
    const fromUrl = n != null && Number.isFinite(n) ? n : null;
    if (fromUrl !== activeTicketId) {
      setActiveTicketId(fromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSelect = useCallback((id: number) => {
    setActiveTicketId(id);
    const params = new URLSearchParams(window.location.search);
    params.set('ticket', String(id));
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }, []);

  const handleClose = useCallback(() => {
    setActiveTicketId(null);
    const params = new URLSearchParams(window.location.search);
    params.delete('ticket');
    const qs = params.toString();
    window.history.replaceState(
      null,
      '',
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname
    );
  }, []);

  return (
    <section className="space-y-6 pt-2">
      <HelpHero stats={stats} />

      <ApproverInbox onSelect={handleSelect} />

      {/* Alturas unificadas por grid stretch: el form (altura natural, sin
          scroll) define la altura de la fila y la card de tickets se estira a
          esa misma altura. La lista pagina de a pocos para no cortar cards. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
        <Card className="overflow-hidden">
          <TicketForm />
        </Card>

        <Card className="overflow-hidden lg:flex lg:flex-col">
          <CardHeader className="border-b flex flex-row items-center justify-between gap-3 shrink-0">
            <div className="space-y-1 min-w-0">
              <CardTitle className="flex items-center gap-2">
                <Inbox className="h-5 w-5 text-muted-foreground" />
                Mis tickets
              </CardTitle>
              <CardDescription>Historial de reportes que enviaste.</CardDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="secondary" className="font-medium">
                {stats.total} {stats.total === 1 ? 'ticket' : 'tickets'}
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => refetch()}
                disabled={isFetching}
                aria-label="Refrescar lista"
                className="h-8 w-8"
              >
                {isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-hidden">
            <MyTicketsList
              tickets={tickets}
              total={ticketsTotal}
              page={myPage}
              onPageChange={setMyPage}
              activeTicketId={activeTicketId}
              onSelect={handleSelect}
              isLoading={myTicketsLoading && !myTicketsPage}
              isPageTransition={myTicketsTransition}
            />
          </CardContent>
        </Card>
      </div>

      <ApproverAllTickets onSelect={handleSelect} />

      <TicketDetailSheet
        ticketId={activeTicketId}
        initialTicket={initialTicket}
        currentUserEmail={currentUserEmail}
        currentUserName={currentUserName}
        onClose={handleClose}
      />
    </section>
  );
}

function HelpHero({ stats }: { stats: Stats }) {
  return (
    <Card className="relative overflow-hidden border-l-4 border-l-primary">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] [background-size:18px_18px]"
      />
      <CardHeader className="flex flex-row items-center justify-between gap-6 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 shrink-0">
            <HelpCircle className="h-6 w-6" strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <CardTitle className="text-2xl tracking-tight">Centro de Ayuda</CardTitle>
            <CardDescription className="mt-1">
              Reportá un problema o consultá el estado de tus solicitudes.
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatChip icon={Inbox} label="Total" value={stats.total} tone="muted" />
          <StatChip icon={Clock} label="Activos" value={stats.active} tone="blue" />
          <StatChip icon={CheckCircle2} label="Resueltos" value={stats.resolved} tone="emerald" />
        </div>
      </CardHeader>
    </Card>
  );
}

type ChipTone = 'muted' | 'blue' | 'emerald';

const CHIP_TONES: Record<ChipTone, string> = {
  muted: 'bg-muted/60 text-muted-foreground border-border',
  blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60',
  emerald:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60',
};

function StatChip({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone: ChipTone;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs ${CHIP_TONES[tone]}`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="font-medium">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}
