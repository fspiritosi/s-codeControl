'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ChevronDown,
  Check,
  Wrench,
  ClipboardList,
  CalendarClock,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';
import {
  acknowledgeAlert,
  type CriticalAlerts,
  type CriticalDocAlert,
  type AlertLevel,
} from '../actions.server';

const LEVEL_STYLES: Record<AlertLevel, { dot: string; row: string; text: string }> = {
  expired: {
    dot: 'bg-red-500',
    row: 'bg-red-500/[0.06] border-red-500/20',
    text: 'text-red-600 dark:text-red-400',
  },
  critical: {
    dot: 'bg-orange-500',
    row: 'bg-orange-500/[0.06] border-orange-500/20',
    text: 'text-orange-600 dark:text-orange-400',
  },
  warning: {
    dot: 'bg-yellow-500',
    row: 'bg-yellow-500/[0.05] border-yellow-500/20',
    text: 'text-yellow-700 dark:text-yellow-500',
  },
};

function daysLabel(daysLeft: number): string {
  if (daysLeft < 0) return `Vencido hace ${Math.abs(daysLeft)} ${Math.abs(daysLeft) === 1 ? 'día' : 'días'}`;
  if (daysLeft === 0) return 'Vence hoy';
  return `Vence en ${daysLeft} ${daysLeft === 1 ? 'día' : 'días'}`;
}

type AckState = { reviewedBy: string; reviewedAt: string };

function AlertRow({
  doc,
  ack,
  onAck,
}: {
  doc: CriticalDocAlert;
  ack: AckState | null;
  onAck: (doc: CriticalDocAlert) => void;
}) {
  const [pending, startTransition] = useTransition();
  const s = LEVEL_STYLES[doc.level];

  const reviewedAt = ack?.reviewedAt ?? doc.reviewedAt;
  const reviewedBy = ack?.reviewedBy ?? doc.reviewedBy;
  const isReviewed = Boolean(reviewedAt);

  let reviewedLabel = '';
  if (reviewedAt) {
    const d = new Date(reviewedAt);
    reviewedLabel = Number.isNaN(d.getTime())
      ? ''
      : ` · ${format(d, "d MMM HH:mm", { locale: es })}`;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-md border px-3 py-2',
        s.row,
        isReviewed && 'opacity-70'
      )}
    >
      <span className={cn('size-2 shrink-0 rounded-full', s.dot)} />
      <Link href={doc.href} className="min-w-0 flex-1 hover:underline">
        <p className="truncate text-sm font-medium">
          {doc.docType} <span className="font-normal text-muted-foreground">· {doc.holder}</span>
        </p>
        <p className={cn('text-xs font-medium', s.text)}>{daysLabel(doc.daysLeft)}</p>
      </Link>

      {isReviewed ? (
        <span className="flex shrink-0 items-center gap-1 text-xs text-green-600 dark:text-green-400">
          <Check className="size-3.5" />
          <span className="hidden sm:inline">
            Revisada por {reviewedBy}
            {reviewedLabel}
          </span>
          <span className="sm:hidden">Revisada</span>
        </span>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="h-7 shrink-0 text-xs"
          disabled={pending}
          onClick={() => startTransition(() => onAck(doc))}
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : 'Marcar revisada'}
        </Button>
      )}
    </div>
  );
}

export function CriticalAlertsPanelClient({ alerts }: { alerts: CriticalAlerts }) {
  const [open, setOpen] = useState(true);
  const [acks, setAcks] = useState<Record<string, AckState>>({});

  const expiredCount = alerts.documents.filter((d) => d.level === 'expired').length;
  const upcomingCount = alerts.totalDocs - expiredCount;
  const hiddenCount = alerts.totalDocs - alerts.documents.length;

  const handleAck = async (doc: CriticalDocAlert) => {
    const res = await acknowledgeAlert({
      alertKey: doc.alertKey,
      alertType: doc.alertType,
      label: `${doc.docType} · ${doc.holder}`,
    });
    if (res.ok) {
      setAcks((prev) => ({
        ...prev,
        [doc.alertKey]: { reviewedBy: res.reviewedBy, reviewedAt: res.reviewedAt },
      }));
    }
  };

  return (
    <Card className="border-l-4 border-l-red-500 bg-red-500/[0.03]">
      <CardContent className="p-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-2 text-left"
        >
          <AlertTriangle className="size-5 shrink-0 text-red-500" />
          <span className="font-semibold">Alertas críticas</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {expiredCount > 0 && (
              <Badge variant="destructive" className="rounded-full">
                {expiredCount} vencida{expiredCount === 1 ? '' : 's'}
              </Badge>
            )}
            {upcomingCount > 0 && (
              <Badge variant="yellow" className="rounded-full">
                {upcomingCount} por vencer ≤7d
              </Badge>
            )}
          </div>
          <ChevronDown
            className={cn(
              'ml-auto size-5 shrink-0 text-muted-foreground transition-transform',
              open && 'rotate-180'
            )}
          />
        </button>

        {open && (
          <div className="mt-3 space-y-3">
            {/* Accesos rápidos (tsk-432) */}
            {(alerts.equipmentOutOfService > 0 || alerts.pendingRequests > 0) && (
              <div className="flex flex-wrap gap-2">
                {alerts.equipmentOutOfService > 0 && (
                  <Link
                    href="/dashboard/maintenance"
                    className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm hover:bg-accent"
                  >
                    <Wrench className="size-4 text-blue-500" />
                    <span className="font-medium">{alerts.equipmentOutOfService}</span>
                    <span className="text-muted-foreground">
                      equipo{alerts.equipmentOutOfService === 1 ? '' : 's'} fuera de servicio
                    </span>
                  </Link>
                )}
                {alerts.pendingRequests > 0 && (
                  <Link
                    href="/dashboard/maintenance?state=Pendiente"
                    className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm hover:bg-accent"
                  >
                    <ClipboardList className="size-4 text-red-500" />
                    <span className="font-medium">{alerts.pendingRequests}</span>
                    <span className="text-muted-foreground">
                      solicitud{alerts.pendingRequests === 1 ? '' : 'es'} pendiente
                      {alerts.pendingRequests === 1 ? '' : 's'}
                    </span>
                  </Link>
                )}
              </div>
            )}

            {/* Documentos críticos (tsk-437 + niveles tsk-434) */}
            {alerts.documents.length > 0 ? (
              <div className="space-y-1.5">
                {alerts.documents.map((doc) => (
                  <AlertRow
                    key={doc.alertKey}
                    doc={doc}
                    ack={acks[doc.alertKey] ?? null}
                    onAck={handleAck}
                  />
                ))}
                {hiddenCount > 0 && (
                  <Link
                    href="/dashboard/document"
                    className="flex items-center gap-1.5 px-3 py-1 text-xs text-primary hover:underline"
                  >
                    <CalendarClock className="size-3.5" />+{hiddenCount} documento
                    {hiddenCount === 1 ? '' : 's'} crítico{hiddenCount === 1 ? '' : 's'} más
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay documentos vencidos ni por vencer en los próximos 7 días.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
