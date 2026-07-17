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
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import {
  cancelAppointment,
  markCompleted,
  setVtvIndicators,
} from '../actions.server';
import type { VtvManageTarget } from '../types';
import { SEMAPHORE_META, STATUS_META, deriveSemaphore } from './vtvStatusMeta';

interface Props {
  target: VtvManageTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}

// 'YYYY-MM-DD' -> Date local (evita corrimiento por zona horaria).
function parseDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function VtvManageDialog({ target, open, onOpenChange, onDone }: Props) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [order, setOrder] = useState(false);
  const [appointment, setAppointment] = useState(false);
  const [pickedDate, setPickedDate] = useState<Date | undefined>(undefined);

  // Hidrata el estado local de los indicadores al abrir o cambiar de objetivo.
  useEffect(() => {
    if (open && target) {
      setOrder(target.hasOrder);
      setAppointment(target.hasAppointment);
      setPickedDate(
        target.appointmentDate ? parseDayKey(target.appointmentDate) : undefined
      );
      setLoadingAction(null);
    }
  }, [open, target]);

  if (!target) return null;

  const isReadOnly = target.status === 'realizada' || target.status === 'cancelada';
  // Semáforo en vivo según lo que el usuario está tildando.
  const semaphore = deriveSemaphore({ hasOrder: order, hasAppointment: appointment });
  const meta = isReadOnly ? STATUS_META[target.status] : SEMAPHORE_META[semaphore];
  const busy = loadingAction !== null;
  const dirty =
    order !== target.hasOrder ||
    appointment !== target.hasAppointment ||
    (pickedDate ? format(pickedDate, 'yyyy-MM-dd') : null) !==
      target.appointmentDate;

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

  const handleSave = () => {
    run(
      'save',
      () =>
        setVtvIndicators({
          appointmentId: target.appointmentId,
          vehicleId: target.vehicleId,
          documentEquipmentId: target.documentEquipmentId,
          hasOrder: order,
          hasAppointment: appointment,
          appointmentDate: pickedDate ? format(pickedDate, 'yyyy-MM-dd') : null,
        }),
      'Indicadores actualizados'
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
        </div>

        {isReadOnly ? (
          <p className="text-sm text-muted-foreground">
            Esta VTV está {meta.label.toLowerCase()} y es de solo lectura.
          </p>
        ) : (
          <>
            {/* Dos indicadores independientes (tkt-480). Sin orden ni bloqueo. */}
            <div className="space-y-3 rounded-md border p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <Label htmlFor="vtv-order" className="text-sm font-medium">
                    Orden de Verificación
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Marcala cuando esté solicitada.
                  </p>
                </div>
                <Switch
                  id="vtv-order"
                  checked={order}
                  onCheckedChange={setOrder}
                  disabled={busy}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <Label htmlFor="vtv-appointment" className="text-sm font-medium">
                    Turno de Verificación
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Marcalo cuando tengas el turno.
                  </p>
                </div>
                <Switch
                  id="vtv-appointment"
                  checked={appointment}
                  onCheckedChange={setAppointment}
                  disabled={busy}
                />
              </div>
            </div>

            {/* Fecha del turno (opcional): alimenta el calendario. */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm">Fecha del turno (opcional)</Label>
              <EnhancedDatePicker date={pickedDate} setDate={setPickedDate} />
            </div>

            <DialogFooter className="flex-wrap gap-2">
              <Button disabled={busy || !dirty} onClick={handleSave}>
                {loadingAction === 'save' ? 'Guardando...' : 'Guardar'}
              </Button>

              {/* Marcar realizada: requiere un turno existente. */}
              {target.appointmentId && (
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

              {/* Cancelar turno: solo si hay turno activo. */}
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
