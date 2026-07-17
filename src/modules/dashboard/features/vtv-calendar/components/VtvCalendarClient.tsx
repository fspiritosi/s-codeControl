'use client';

import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Card } from '@/shared/components/ui/card';
import type { VtvCalendarItem, VtvManageTarget } from '../types';
import { VtvCalendar } from './VtvCalendar';
import { VtvDayPanel } from './VtvDayPanel';
import { VtvManageDialog } from './VtvManageDialog';

interface Props {
  items: VtvCalendarItem[];
}

// Convierte un turno del calendario en el objetivo unificado del diálogo.
function toTarget(item: VtvCalendarItem): VtvManageTarget {
  return {
    appointmentId: item.appointmentId,
    vehicleId: item.vehicleId,
    documentEquipmentId: item.documentEquipmentId,
    domain: item.domain,
    internNumber: item.internNumber,
    brand: item.brand,
    model: item.model,
    status: item.status,
    validity: item.documentValidity,
    appointmentDate: item.appointmentDate,
    hasOrder: item.hasOrder,
    hasAppointment: item.hasAppointment,
  };
}

export function VtvCalendarClient({ items }: Props) {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState<string | null>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [target, setTarget] = useState<VtvManageTarget | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const dayItems = useMemo(
    () =>
      selectedDay ? items.filter((i) => i.appointmentDate === selectedDay) : [],
    [items, selectedDay]
  );

  const handleManage = (item: VtvCalendarItem) => {
    setTarget(toTarget(item));
    setDialogOpen(true);
  };

  const handleDone = () => {
    setDialogOpen(false);
    router.refresh();
  };

  return (
    <>
      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[auto_minmax(0,1fr)]">
        <Card className="w-fit p-2">
          <VtvCalendar
            items={items}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
          />
        </Card>
        <Card className="min-w-0 p-4">
          <VtvDayPanel
            date={selectedDay}
            items={dayItems}
            onManage={handleManage}
          />
        </Card>
      </div>

      <VtvManageDialog
        target={target}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onDone={handleDone}
      />
    </>
  );
}
