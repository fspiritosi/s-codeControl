'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import type { VtvListItem, VtvManageTarget, VtvVehicleOption } from '../types';
import { VtvCreateDialog } from './VtvCreateDialog';
import { VtvListTable } from './VtvListTable';
import { VtvManageDialog } from './VtvManageDialog';

interface Props {
  items: VtvListItem[];
  vehicles: VtvVehicleOption[];
}

// Convierte una fila del listado en el objetivo unificado del diálogo.
function toTarget(item: VtvListItem): VtvManageTarget {
  return {
    appointmentId: item.appointmentId,
    vehicleId: item.vehicleId,
    documentEquipmentId: item.documentEquipmentId,
    domain: item.domain,
    internNumber: item.internNumber,
    brand: item.brand,
    model: item.model,
    status: item.status,
    validity: item.validity,
    appointmentDate: item.appointmentDate,
    hasOrder: item.hasOrder,
    hasAppointment: item.hasAppointment,
  };
}

export function VtvListClient({ items, vehicles }: Props) {
  const router = useRouter();
  const [target, setTarget] = useState<VtvManageTarget | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const handleManage = (item: VtvListItem) => {
    setTarget(toTarget(item));
    setManageOpen(true);
  };

  const handleManageDone = () => {
    setManageOpen(false);
    router.refresh();
  };

  const handleCreateDone = () => {
    setCreateOpen(false);
    router.refresh();
  };

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Documentos de VTV de tu flota y el estado de su turno.
        </p>
        <Button onClick={() => setCreateOpen(true)}>Agendar turno</Button>
      </div>

      <VtvListTable items={items} onManage={handleManage} />

      <VtvManageDialog
        target={target}
        open={manageOpen}
        onOpenChange={setManageOpen}
        onDone={handleManageDone}
      />

      <VtvCreateDialog
        vehicles={vehicles}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onDone={handleCreateDone}
      />
    </div>
  );
}
