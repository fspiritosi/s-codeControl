'use client';

import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { EnhancedDatePicker } from '@/shared/components/ui/enhanced-datepicket';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { createVtvAppointment } from '../actions.server';
import type { VtvVehicleOption } from '../types';

interface Props {
  vehicles: VtvVehicleOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}

export function VtvCreateDialog({ vehicles, open, onOpenChange, onDone }: Props) {
  const [vehicleId, setVehicleId] = useState<string>('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Resetea el formulario al cerrar.
  useEffect(() => {
    if (!open) {
      setVehicleId('');
      setDate(undefined);
      setNotes('');
      setLoading(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!vehicleId) {
      toast.error('Seleccioná un vehículo');
      return;
    }
    if (!date) {
      toast.error('Seleccioná la fecha del turno');
      return;
    }
    const option = vehicles.find((v) => v.vehicleId === vehicleId);
    setLoading(true);
    try {
      const result = await createVtvAppointment({
        vehicleId,
        documentEquipmentId: option?.documentEquipmentId ?? null,
        appointmentDate: format(date, 'yyyy-MM-dd'),
        notes: notes.trim() || null,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Turno agendado');
      onDone();
    } catch {
      toast.error('Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agendar turno de VTV</DialogTitle>
          <DialogDescription>
            Programá un turno de VTV para un vehículo de tu flota.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Vehículo</Label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccioná un vehículo" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => (
                  <SelectItem key={v.vehicleId} value={v.vehicleId}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Fecha del turno</Label>
            <EnhancedDatePicker date={date} setDate={setDate} />
          </div>

          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones del turno"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button disabled={loading} onClick={handleSubmit}>
            {loading ? 'Guardando...' : 'Agendar turno'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
