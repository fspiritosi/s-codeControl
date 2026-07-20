'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';

import { SALES_VOUCHER_TYPES, VOUCHER_TYPE_LABELS } from '@/modules/sales/shared/types';
import { updateSalesSequences } from '../actions.server';

export interface SequenceConfigItem {
  id: string;
  number: number;
  name: string;
  sequences: { voucher_type: string; next_number: number }[];
}

interface SequenceConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: SequenceConfigItem | null;
}

export function SequenceConfigDialog({ open, onOpenChange, item }: SequenceConfigDialogProps) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Al abrir, precarga el next_number de cada tipo (default 1 si no existe la secuencia).
  useEffect(() => {
    if (!open || !item) return;
    const map: Record<string, string> = {};
    for (const vt of SALES_VOUCHER_TYPES) {
      const seq = item.sequences.find((s) => s.voucher_type === vt);
      map[vt] = String(seq?.next_number ?? 1);
    }
    setValues(map);
  }, [open, item]);

  const handleSubmit = async () => {
    if (!item) return;

    // Validación simple: enteros positivos.
    const sequences = SALES_VOUCHER_TYPES.map((vt) => ({
      voucher_type: vt,
      next_number: Number(values[vt]),
    }));
    const invalid = sequences.some(
      (s) => !Number.isInteger(s.next_number) || s.next_number < 1
    );
    if (invalid) {
      toast.error('El número inicial de cada comprobante debe ser un entero mayor o igual a 1');
      return;
    }

    setSubmitting(true);
    try {
      const result = await updateSalesSequences({ point_of_sale_id: item.id, sequences });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Numeración actualizada');
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar la numeración');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Configurar numeración</DialogTitle>
          <DialogDescription>
            {item
              ? `Punto de venta ${String(item.number).padStart(4, '0')} — ${item.name}. Definí el próximo número a emitir por cada tipo de comprobante.`
              : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {SALES_VOUCHER_TYPES.map((vt) => (
            <div key={vt} className="grid grid-cols-2 items-center gap-3">
              <Label htmlFor={`seq-${vt}`}>{VOUCHER_TYPE_LABELS[vt] ?? vt}</Label>
              <Input
                id={`seq-${vt}`}
                type="number"
                min="1"
                step="1"
                value={values[vt] ?? ''}
                onChange={(e) => setValues((prev) => ({ ...prev, [vt]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
