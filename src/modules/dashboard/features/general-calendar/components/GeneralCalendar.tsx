'use client';

import { addMonths, format, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { DayButtonProps } from 'react-day-picker';
import { Button } from '@/shared/components/ui/button';
import { Calendar } from '@/shared/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { cn } from '@/shared/lib/utils';
import type { CalendarEvent } from '../types';

interface Props {
  events: CalendarEvent[];
  selectedDay: string | null;
  onSelectDay: (date: string) => void;
}

function parseDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const name = format(new Date(2020, i, 1), 'LLLL', { locale: es });
  return name.charAt(0).toUpperCase() + name.slice(1);
});

export function GeneralCalendar({ events, selectedDay, onSelectDay }: Props) {
  const selectedDate = selectedDay ? parseDayKey(selectedDay) : undefined;
  const [month, setMonth] = useState<Date>(() => selectedDate ?? new Date());

  const years = useMemo(() => {
    const base = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, i) => base - 2 + i);
  }, []);

  const { modifiers, counts } = useMemo(() => {
    const byDay = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const list = byDay.get(ev.date) ?? [];
      list.push(ev);
      byDay.set(ev.date, list);
    }

    const expired: Date[] = [];
    const soon: Date[] = [];
    const upcoming: Date[] = [];
    const maintenance: Date[] = [];
    const countMap = new Map<string, number>();

    for (const [key, list] of byDay) {
      countMap.set(key, list.length);
      const date = parseDayKey(key);
      const sevs = list.map((e) => e.severity);
      // Prioridad de color del día: vencido > próximo (≤7d) > por vencer > mantenimiento.
      if (sevs.includes('expired')) expired.push(date);
      else if (sevs.includes('soon')) soon.push(date);
      else if (sevs.includes('upcoming')) upcoming.push(date);
      else maintenance.push(date);
    }

    return { modifiers: { expired, soon, upcoming, maintenance }, counts: countMap };
  }, [events]);

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

  const DayButton = (props: DayButtonProps) => {
    const { day, modifiers: _modifiers, children, ...buttonProps } = props;
    const key = format(day.date, 'yyyy-MM-dd');
    const count = counts.get(key) ?? 0;

    return (
      <button {...buttonProps} className={cn(buttonProps.className, 'relative')}>
        {children}
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-semibold leading-none text-primary-foreground">
            {count}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 px-1">
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

        <div className="flex flex-1 items-center justify-center gap-2">
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
        </div>

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

      <Calendar
        mode="single"
        month={month}
        onMonthChange={setMonth}
        hideNavigation
        selected={selectedDate}
        onDayClick={(date) => onSelectDay(format(date, 'yyyy-MM-dd'))}
        modifiers={modifiers}
        modifiersClassNames={{
          expired: 'bg-red-500/20 text-red-700 dark:text-red-400 font-semibold rounded-md',
          soon: 'bg-orange-500/20 text-orange-700 dark:text-orange-400 font-semibold rounded-md',
          upcoming: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-500 rounded-md',
          maintenance: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-md',
        }}
        classNames={{ month_caption: 'hidden' }}
        components={{ DayButton }}
      />

      {/* Referencia de colores */}
      <div className="flex flex-wrap gap-3 px-1 pt-1 text-xs text-muted-foreground">
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
