'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Card } from '@/shared/components/ui/card';
import { MonthCalendar, type MonthCalendarEvent } from '@/shared/components/calendar/MonthCalendar';
import type { VtvCalendarItem, VtvManageTarget } from '../types';
import { VtvManageDialog } from './VtvManageDialog';
import { deriveDisplayKey, type VtvDisplayKey } from './vtvStatusMeta';

interface Props {
  items: VtvCalendarItem[];
}

// Color del punto del evento según el semáforo derivado (tkt-480).
const DOT_BY_KEY: Record<VtvDisplayKey, string> = {
  red: 'bg-red-500',
  amber: 'bg-yellow-500',
  green: 'bg-green-500',
  realizada: 'bg-muted-foreground',
  cancelada: 'bg-muted-foreground',
};

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
  const [target, setTarget] = useState<VtvManageTarget | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleManage = (item: VtvCalendarItem) => {
    setTarget(toTarget(item));
    setDialogOpen(true);
  };

  const events: MonthCalendarEvent[] = useMemo(
    () =>
      items.map((item) => {
        const key = deriveDisplayKey(item.status, {
          hasOrder: item.hasOrder,
          hasAppointment: item.hasAppointment,
        });
        const label = item.domain
          ? `Int ${item.internNumber} · ${item.domain}`
          : `Interno ${item.internNumber}`;
        return {
          id: item.appointmentId,
          date: item.appointmentDate,
          label,
          dotClassName: DOT_BY_KEY[key],
          onClick: () => handleManage(item),
        };
      }),
    [items]
  );

  const handleDone = () => {
    setDialogOpen(false);
    router.refresh();
  };

  return (
    <>
      <Card className="p-3">
        <MonthCalendar events={events} maxPerDay={3} />
      </Card>

      <VtvManageDialog
        target={target}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onDone={handleDone}
      />
    </>
  );
}
