'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/shared/components/ui/card';
import { GeneralCalendar } from './GeneralCalendar';
import { CalendarDayPanel } from './CalendarDayPanel';
import type { CalendarEvent } from '../types';

export function GeneralCalendarClient({ events }: { events: CalendarEvent[] }) {
  const [selectedDay, setSelectedDay] = useState<string | null>(() =>
    format(new Date(), 'yyyy-MM-dd')
  );

  const dayEvents = useMemo(
    () => events.filter((e) => e.date === selectedDay),
    [events, selectedDay]
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Card>
        <CardContent className="p-4">
          <GeneralCalendar
            events={events}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <CalendarDayPanel date={selectedDay} events={dayEvents} />
        </CardContent>
      </Card>
    </div>
  );
}
