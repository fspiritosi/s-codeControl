'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/shared/components/ui/card';
import { MonthCalendar, type MonthCalendarEvent } from '@/shared/components/calendar/MonthCalendar';
import type { CalendarEvent, CalendarEventSeverity } from '../types';

const DOT_BY_SEVERITY: Record<CalendarEventSeverity, string> = {
  expired: 'bg-red-500',
  soon: 'bg-orange-500',
  upcoming: 'bg-yellow-500',
  maintenance: 'bg-blue-500',
};

export function GeneralCalendarClient({ events }: { events: CalendarEvent[] }) {
  const router = useRouter();

  const calendarEvents: MonthCalendarEvent[] = useMemo(
    () =>
      events.map((ev) => ({
        id: ev.id,
        date: ev.date,
        label: `${ev.title} · ${ev.subtitle}`,
        dotClassName: DOT_BY_SEVERITY[ev.severity],
        onClick: () => router.push(ev.href),
      })),
    [events, router]
  );

  return (
    <div className="space-y-3">
      <Card className="p-3">
        <MonthCalendar events={calendarEvents} maxPerDay={3} />
      </Card>

      {/* Referencia de colores */}
      <div className="flex flex-wrap gap-3 px-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-red-500/70" /> Vencido
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-orange-500/70" /> ≤ 7 días
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-yellow-500/70" /> Por vencer
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-blue-500/70" /> Mantenimiento
        </span>
      </div>
    </div>
  );
}
