'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import type { VtvCalendarItem } from '../types';
import { STATUS_META } from './vtvStatusMeta';

interface Props {
  date: string | null;
  items: VtvCalendarItem[];
  onManage: (item: VtvCalendarItem) => void;
  onAddNew?: () => void;
}

function parseDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function VtvDayPanel({ date, items, onManage, onAddNew }: Props) {
  if (!date) {
    return (
      <div className="flex h-full min-h-40 items-center justify-center text-sm text-muted-foreground">
        Seleccioná un día para ver los turnos de VTV.
      </div>
    );
  }

  const title = format(parseDayKey(date), "EEEE d 'de' MMMM 'de' yyyy", {
    locale: es,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold capitalize">{title}</h3>
        {onAddNew && (
          <Button size="sm" variant="outline" onClick={onAddNew}>
            Agendar turno
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay turnos de VTV para este día.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const meta = STATUS_META[item.status];
            return (
              <li
                key={item.appointmentId}
                className="flex items-start justify-between gap-3 rounded-md border p-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {item.domain || `Interno ${item.internNumber}`}
                    </span>
                    {item.domain && item.internNumber && (
                      <span className="text-xs text-muted-foreground">
                        Interno {item.internNumber}
                      </span>
                    )}
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {[item.brand, item.model].filter(Boolean).join(' ') ||
                      'Sin marca/modelo'}
                  </p>
                  {item.documentValidity && (
                    <p className="text-xs text-muted-foreground">
                      Vence: {item.documentValidity}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onManage(item)}
                >
                  Gestionar
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
