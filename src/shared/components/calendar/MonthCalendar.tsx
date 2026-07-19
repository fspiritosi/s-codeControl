'use client';

import { useMemo, useState } from 'react';
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover';
import { cn } from '@/shared/lib/utils';

export interface MonthCalendarEvent {
  id: string;
  date: string; // 'YYYY-MM-DD'
  label: string;
  /** Clase de color del punto indicador, ej. 'bg-red-500'. */
  dotClassName?: string;
  onClick?: () => void;
}

interface Props {
  events: MonthCalendarEvent[];
  /** Máximo de eventos visibles por celda antes de "+N más". */
  maxPerDay?: number;
  /** Clic en un día (área vacía de la celda). */
  onDayClick?: (date: string) => void;
  initialMonth?: Date;
}

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const name = format(new Date(2020, i, 1), 'LLLL', { locale: es });
  return name.charAt(0).toUpperCase() + name.slice(1);
});

function EventPill({ event }: { event: MonthCalendarEvent }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        event.onClick?.();
      }}
      title={event.label}
      className={cn(
        'flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-xs',
        'hover:bg-accent',
        event.onClick && 'cursor-pointer'
      )}
    >
      <span className={cn('size-2 shrink-0 rounded-full', event.dotClassName ?? 'bg-primary')} />
      <span className="truncate">{event.label}</span>
    </button>
  );
}

export function MonthCalendar({
  events,
  maxPerDay = 3,
  onDayClick,
  initialMonth,
}: Props) {
  const [month, setMonth] = useState<Date>(() => initialMonth ?? new Date());

  const years = useMemo(() => {
    const base = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, i) => base - 2 + i);
  }, []);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, MonthCalendarEvent[]>();
    for (const ev of events) {
      const list = map.get(ev.date) ?? [];
      list.push(ev);
      map.set(ev.date, list);
    }
    return map;
  }, [events]);

  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [month]);

  const handleMonthName = (value: string) => {
    const next = new Date(month);
    next.setMonth(Number(value));
    setMonth(next);
  };

  const handleYear = (value: string) => {
    const next = new Date(month);
    next.setFullYear(Number(value));
    setMonth(next);
  };

  return (
    <div className="flex flex-col">
      {/* Barra de navegación */}
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setMonth(new Date())}
        >
          Hoy
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            aria-label="Mes anterior"
            onClick={() => setMonth((m) => subMonths(m, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Select value={String(month.getMonth())} onValueChange={handleMonthName}>
            <SelectTrigger className="h-8 w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((name, i) => (
                <SelectItem key={name} value={String(i)}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(month.getFullYear())} onValueChange={handleYear}>
            <SelectTrigger className="h-8 w-[90px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            aria-label="Mes siguiente"
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Encabezado de días de la semana */}
      <div className="grid grid-cols-7 border-b text-center text-xs font-medium uppercase text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Grilla de días */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDay.get(key) ?? [];
          const inMonth = isSameMonth(day, month);
          const today = isToday(day);
          const visible = dayEvents.slice(0, maxPerDay);
          const hidden = dayEvents.length - visible.length;

          return (
            <div
              key={key}
              onClick={() => onDayClick?.(key)}
              className={cn(
                'min-h-24 border-b border-r p-1 [&:nth-child(7n)]:border-r-0',
                !inMonth && 'bg-muted/30 text-muted-foreground',
                onDayClick && 'cursor-pointer hover:bg-accent/30'
              )}
            >
              <div className="mb-1 flex justify-end">
                <span
                  className={cn(
                    'flex size-6 items-center justify-center rounded-full text-xs',
                    today && 'bg-primary font-semibold text-primary-foreground',
                    !today && !inMonth && 'text-muted-foreground/60'
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>

              <div className="space-y-0.5">
                {visible.map((ev) => (
                  <EventPill key={ev.id} event={ev} />
                ))}

                {hidden > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full rounded px-1 py-0.5 text-left text-xs font-medium text-muted-foreground hover:bg-accent"
                      >
                        +{hidden} más
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-64 space-y-0.5 p-2">
                      <p className="mb-1 px-1 text-xs font-medium capitalize text-muted-foreground">
                        {format(day, "EEEE d 'de' MMMM", { locale: es })}
                      </p>
                      {dayEvents.map((ev) => (
                        <EventPill key={ev.id} event={ev} />
                      ))}
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
