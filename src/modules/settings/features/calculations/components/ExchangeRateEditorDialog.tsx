'use client';

import { useEffect, useState, useTransition } from 'react';
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
import { upsertExchangeRate } from '../actions.server';
import type { ExchangeRateData } from '../types';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** undefined = crear; ExchangeRateData = editar */
  rate?: ExchangeRateData;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ExchangeRateEditorDialog({ open, onOpenChange, rate }: Props) {
  const router = useRouter();
  const isEdit = !!rate;
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ valor: '', fecha: today(), fuente: '' });

  useEffect(() => {
    if (!open) return;
    if (rate) {
      setForm({ valor: String(rate.valor), fecha: rate.fecha, fuente: rate.fuente ?? '' });
    } else {
      setForm({ valor: '', fecha: today(), fuente: '' });
    }
  }, [open, rate]);

  const handleSubmit = () => {
    const valor = parseFloat(form.valor);
    if (Number.isNaN(valor) || valor <= 0) {
      toast.error('Ingresá un valor válido (mayor a 0)');
      return;
    }
    if (!form.fecha) {
      toast.error('Ingresá la fecha');
      return;
    }
    startTransition(async () => {
      const r = await upsertExchangeRate({
        id: rate?.id,
        valor,
        fecha: form.fecha,
        fuente: form.fuente || null,
      });
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success(isEdit ? 'Cotización actualizada' : 'Cotización creada');
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar cotización' : 'Nueva cotización'}</DialogTitle>
          <DialogDescription>Tipo de cambio Dólar (USD) → Pesos (ARS).</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="er-valor">Valor (ARS por 1 USD)</Label>
            <Input
              id="er-valor"
              type="number"
              step="0.0001"
              min="0"
              placeholder="1000.0000"
              value={form.valor}
              onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="er-fecha">Fecha</Label>
            <Input
              id="er-fecha"
              type="date"
              value={form.fecha}
              onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="er-fuente">Fuente (opcional)</Label>
            <Input
              id="er-fuente"
              placeholder="Ej: BNA, dólar oficial"
              value={form.fuente}
              onChange={(e) => setForm((f) => ({ ...f, fuente: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isEdit ? 'Guardar' : 'Crear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
