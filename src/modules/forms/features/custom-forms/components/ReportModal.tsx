'use client'
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { useState } from 'react';
import { VehicleChecklistReport } from './vehicle-checklist-report';

export function ReportModal({ vehicles, checklists }: { vehicles: VehicleWithBrand[]; checklists: CheckListWithAnswer[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Generar Reporte de Vehículos</Button>
      </DialogTrigger>
      <DialogContent className="max-w-[60vw] min-w-[50vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader></DialogHeader>
        <VehicleChecklistReport vehicles={vehicles} checklists={checklists} onClose={() => setIsOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
