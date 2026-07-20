'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';

import { createSalesPointOfSale, updateSalesPointOfSale } from '../actions.server';

export interface PointOfSaleItem {
  id: string;
  number: number;
  name: string;
  is_active: boolean;
}

interface PointOfSaleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si se pasa, el diálogo edita ese punto de venta; si no, crea uno nuevo. */
  item?: PointOfSaleItem | null;
}

export function PointOfSaleFormDialog({ open, onOpenChange, item }: PointOfSaleFormDialogProps) {
  const router = useRouter();
  const isEditMode = Boolean(item);

  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<{ number?: string; name?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  // Sincroniza el formulario al abrir (según sea alta o edición).
  useEffect(() => {
    if (!open) return;
    if (item) {
      setNumber(String(item.number));
      setName(item.name);
      setIsActive(item.is_active);
    } else {
      setNumber('');
      setName('');
      setIsActive(true);
    }
    setErrors({});
  }, [open, item]);

  const validate = () => {
    const next: { number?: string; name?: string } = {};
    const parsedNumber = Number(number);
    if (!number.trim() || !Number.isInteger(parsedNumber) || parsedNumber <= 0) {
      next.number = 'El número de punto de venta debe ser un entero mayor a 0';
    }
    if (!name.trim()) {
      next.name = 'El nombre es requerido';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = { number: Number(number), name: name.trim(), is_active: isActive };
      const result = isEditMode
        ? await updateSalesPointOfSale(item!.id, payload)
        : await createSalesPointOfSale(payload);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(isEditMode ? 'Punto de venta actualizado' : 'Punto de venta creado');
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar el punto de venta');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar punto de venta' : 'Nuevo punto de venta'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="pos-number">Número *</Label>
            <Input
              id="pos-number"
              type="number"
              min="1"
              step="1"
              placeholder="Ej: 1"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />
            {errors.number && <p className="text-sm text-destructive">{errors.number}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pos-name">Nombre *</Label>
            <Input
              id="pos-name"
              placeholder="Ej: Casa central"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="pos-active">Activo</Label>
              <p className="text-sm text-muted-foreground">
                Los puntos de venta inactivos no se pueden usar para emitir comprobantes.
              </p>
            </div>
            <Switch id="pos-active" checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Crear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
