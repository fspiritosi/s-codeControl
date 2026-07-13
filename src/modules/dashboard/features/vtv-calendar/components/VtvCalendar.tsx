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
import type { VtvCalendarItem } from '../types';

interface Props {
  items: VtvCalendarItem[];
  selectedDay: string | null;
  onSelectDay: (date: string) => void;
}

// 'YYYY-MM-DD' -> Date local (evita corrimiento por zona horaria).
function parseDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Nombres de mes en español (standalone), capitalizados.
const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const name = format(new Date(2020, i, 1), 'LLLL', { locale: es });
  return name.charAt(0).toUpperCase() + name.slice(1);
});

export function VtvCalendar({ items, selectedDay, onSelectDay }: Props) {
  const selectedDate = selectedDay ? parseDayKey(selectedDay) : undefined;

  // Mes visible controlado: arranca en el del día seleccionado (o el mes actual).
  const [month, setMonth] = useState<Date>(() => selectedDate ?? new Date());

  // Rango de años del selector: 2 atrás y 4 adelante respecto del mes visible.
  const years = useMemo(() => {
    const base = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, i) => base - 2 + i);
  }, []);

  const { modifiers, counts } = useMemo(() => {
    const byDay = new Map<string, VtvCalendarItem[]>();
    for (const item of items) {
      const list = byDay.get(item.appointmentDate) ?? [];
      list.push(item);
      byDay.set(item.appointmentDate, list);
    }

    const pendiente: Date[] = [];
    const ordenSolicitada: Date[] = [];
    const realizada: Date[] = [];
    const countMap = new Map<string, number>();

    for (const [key, list] of byDay) {
      countMap.set(key, list.length);
      const date = parseDayKey(key);
      // Prioridad de color del día: pendiente > orden_solicitada > realizada.
      if (list.some((i) => i.status === 'pendiente')) {
        pendiente.push(date);
      } else if (list.some((i) => i.status === 'orden_solicitada')) {
        ordenSolicitada.push(date);
      } else {
        realizada.push(date);
      }
    }

    return {
      modifiers: { pendiente, ordenSolicitada, realizada },
      counts: countMap,
    };
  }, [items]);

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
        {count > 1 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-semibold leading-none text-primary-foreground">
            {count}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-2">
      {/* Navegación propia: botones prev/next + selectores de mes y año.
          Reemplaza las flechas absolute del Calendar que se solapaban con el sidebar. */}
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
          pendiente: 'bg-red-500/20 text-red-700 font-semibold rounded-md',
          ordenSolicitada: 'bg-green-500/20 text-green-700 rounded-md',
          realizada: 'bg-muted text-muted-foreground rounded-md',
        }}
        classNames={{ month_caption: 'hidden' }}
        components={{ DayButton }}
      />
    </div>
  );
}
