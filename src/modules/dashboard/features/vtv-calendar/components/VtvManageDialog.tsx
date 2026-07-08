'use client';

import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/shared/components/ui/badge';
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
import {
  cancelAppointment,
  createVtvAppointment,
  markCompleted,
  programAppointment,
  rescheduleAppointment,
} from '../actions.server';
import type { VtvManageTarget } from '../types';
import { STATUS_META } from './vtvStatusMeta';

interface Props {
  target: VtvManageTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}

// Modo del datepicker embebido: programar (sin turno / pendiente) o reprogramar.
type PickerMode = 'programar' | 'reprogramar' | null;

export function VtvManageDialog({ target, open, onOpenChange, onDone }: Props) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const [pickedDate, setPickedDate] = useState<Date | undefined>(undefined);

  // Resetea el estado interno al abrir/cerrar o cambiar de objetivo.
  useEffect(() => {
    if (!open) {
      setPickerMode(null);
      setPickedDate(undefined);
      setLoadingAction(null);
    }
  }, [open]);

  if (!target) return null;

  const meta = STATUS_META[target.status];
  const isReadOnly = target.status === 'realizada' || target.status === 'cancelada';
  const canProgram = target.status === 'sin_programar' || target.status === 'pendiente';
  const isRequested = target.status === 'orden_solicitada';
  const busy = loadingAction !== null;

  // Ejecuta una acción que devuelve { error } o { id, error }.
  const run = async (
    key: string,
    action: () => Promise<{ error?: string | null; id?: string }>,
    successMsg: string
  ) => {
    setLoadingAction(key);
    try {
      const result = await action();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(successMsg);
      onDone();
    } catch {
      toast.error('Ocurrió un error inesperado');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleProgramConfirm = () => {
    if (!pickedDate) {
      toast.error('Seleccioná la fecha del turno');
      return;
    }
    const fecha = format(pickedDate, 'yyyy-MM-dd');
    // Con turno existente (placeholder pendiente) → programAppointment.
    // Sin turno → alta manual con createVtvAppointment.
    if (target.appointmentId) {
      run(
        'program',
        () => programAppointment(target.appointmentId as string, fecha),
        'Turno programado'
      );
    } else {
      run(
        'program',
        () =>
          createVtvAppointment({
            vehicleId: target.vehicleId,
            documentEquipmentId: target.documentEquipmentId,
            appointmentDate: fecha,
          }),
        'Turno programado'
      );
    }
  };

  const handleRescheduleConfirm = () => {
    if (!pickedDate) {
      toast.error('Seleccioná la fecha nueva');
      return;
    }
    run(
      'reschedule',
      () =>
        rescheduleAppointment(
          target.appointmentId as string,
          format(pickedDate, 'yyyy-MM-dd')
        ),
      'Turno reprogramado'
    );
  };

  const title = target.domain || `Interno ${target.internNumber}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {title}
            <Badge variant={meta.variant}>{meta.label}</Badge>
          </DialogTitle>
          <DialogDescription>
            {[target.brand, target.model].filter(Boolean).join(' ') ||
              'Sin marca/modelo'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1 text-sm">
          {target.domain && target.internNumber && (
            <p>
              <span className="text-muted-foreground">Interno: </span>
              {target.internNumber}
            </p>
          )}
          {target.validity && (
            <p>
              <span className="text-muted-foreground">Vencimiento: </span>
              {target.validity}
            </p>
          )}
          {target.appointmentDate && (
            <p>
              <span className="text-muted-foreground">Fecha del turno: </span>
              {target.appointmentDate}
            </p>
          )}
        </div>

        {pickerMode && (
          <div className="flex flex-col gap-2 rounded-md border p-3">
            <span className="text-sm font-medium">
              {pickerMode === 'programar'
                ? 'Fecha del turno'
                : 'Nueva fecha del turno'}
            </span>
            <EnhancedDatePicker date={pickedDate} setDate={setPickedDate} />
          </div>
        )}

        {isReadOnly ? (
          <p className="text-sm text-muted-foreground">
            Este turno está {meta.label.toLowerCase()} y es de solo lectura.
          </p>
        ) : (
          <DialogFooter className="flex-wrap gap-2">
            {/* Programar: sin_programar | pendiente */}
            {canProgram &&
              (pickerMode === 'programar' ? (
                <Button
                  variant="success"
                  disabled={busy}
                  onClick={handleProgramConfirm}
                >
                  {loadingAction === 'program' ? 'Guardando...' : 'Confirmar fecha'}
                </Button>
              ) : (
                <Button
                  variant="success"
                  disabled={busy}
                  onClick={() => {
                    setPickerMode('programar');
                    setPickedDate(undefined);
                  }}
                >
                  Programar turno
                </Button>
              ))}

            {/* Orden solicitada: marcar realizada */}
            {isRequested && (
              <Button
                variant="success"
                disabled={busy}
                onClick={() =>
                  run(
                    'completed',
                    () => markCompleted(target.appointmentId as string),
                    'VTV marcada como realizada'
                  )
                }
              >
                {loadingAction === 'completed'
                  ? 'Guardando...'
                  : 'Marcar realizada'}
              </Button>
            )}

            {/* Orden solicitada: reprogramar */}
            {isRequested &&
              (pickerMode === 'reprogramar' ? (
                <Button
                  variant="default"
                  disabled={busy}
                  onClick={handleRescheduleConfirm}
                >
                  {loadingAction === 'reschedule'
                    ? 'Guardando...'
                    : 'Confirmar fecha'}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setPickerMode('reprogramar');
                    setPickedDate(undefined);
                  }}
                >
                  Reprogramar
                </Button>
              ))}

            {/* Cancelar turno: solo si hay turno activo */}
            {target.appointmentId && (
              <Button
                variant="destructive"
                disabled={busy}
                onClick={() =>
                  run(
                    'cancel',
                    () => cancelAppointment(target.appointmentId as string),
                    'Turno cancelado'
                  )
                }
              >
                {loadingAction === 'cancel' ? 'Cancelando...' : 'Cancelar turno'}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
