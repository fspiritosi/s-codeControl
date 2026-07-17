'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileText, Truck, Wrench } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { CalendarEvent, CalendarEventSeverity, CalendarEventType } from '../types';

const SEVERITY_DOT: Record<CalendarEventSeverity, string> = {
  expired: 'bg-red-500',
  soon: 'bg-orange-500',
  upcoming: 'bg-yellow-500',
  maintenance: 'bg-blue-500',
};

const TYPE_ICON: Record<CalendarEventType, typeof FileText> = {
  doc_employee: FileText,
  doc_equipment: Truck,
  maintenance: Wrench,
};

function parseDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

interface Props {
  date: string | null;
  events: CalendarEvent[];
}

export function CalendarDayPanel({ date, events }: Props) {
  if (!date) {
    return (
      <div className="flex h-full min-h-40 items-center justify-center text-sm text-muted-foreground">
        Seleccioná un día para ver sus vencimientos y mantenimientos.
      </div>
    );
  }

  const title = format(parseDayKey(date), "EEEE d 'de' MMMM 'de' yyyy", { locale: es });

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold capitalize">{title}</h3>

      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay vencimientos ni mantenimientos este día.</p>
      ) : (
        <ul className="space-y-2">
          {events.map((ev) => {
            const Icon = TYPE_ICON[ev.type];
            return (
              <li key={ev.id}>
                <Link
                  href={ev.href}
                  className="flex items-start gap-2 rounded-md border p-3 transition-colors hover:bg-accent"
                >
                  <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', SEVERITY_DOT[ev.severity])} />
                  <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{ev.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{ev.subtitle}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
