'use client';

import { useState } from 'react';
import { z } from 'zod';
import { createProduct } from '@/modules/products/features/list/actions.server';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { toast } from 'sonner';

const quickProductSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200),
  cost_price: z.coerce.number().min(0, 'El precio debe ser >= 0'),
  vat_rate: z.coerce.number().min(0).max(100).default(21),
  unit_of_measure: z.string().max(20).default('UN'),
  type: z.enum(['PRODUCT', 'SERVICE', 'RAW_MATERIAL', 'CONSUMABLE']).default('PRODUCT'),
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductCreated: (product: { id: string; code: string; name: string; cost_price: number; vat_rate: number }) => void;
}

const TYPE_LABELS: Record<string, string> = {
  PRODUCT: 'Producto',
  SERVICE: 'Servicio',
  RAW_MATERIAL: 'Materia prima',
  CONSUMABLE: 'Consumible',
};

export default function QuickCreateProductModal({ open, onOpenChange, onProductCreated }: Props) {
  const [name, setName] = useState('');
  const [costPrice, setCostPrice] = useState('0');
  const [vatRate, setVatRate] = useState('21');
  const [unitOfMeasure, setUnitOfMeasure] = useState('UN');
  const [type, setType] = useState<'PRODUCT' | 'SERVICE' | 'RAW_MATERIAL' | 'CONSUMABLE'>('PRODUCT');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName('');
    setCostPrice('0');
    setVatRate('21');
    setUnitOfMeasure('UN');
    setType('PRODUCT');
    setErrors({});
  };

  const handleSubmit = async () => {
    setErrors({});
    const parsed = quickProductSchema.safeParse({
      name,
      cost_price: costPrice,
      vat_rate: vatRate,
      unit_of_measure: unitOfMeasure,
      type,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const result = await createProduct({
        name: parsed.data.name,
        cost_price: parsed.data.cost_price,
        vat_rate: parsed.data.vat_rate,
        unit_of_measure: parsed.data.unit_of_measure,
        type: parsed.data.type,
        purchase_sale_type: 'PURCHASE',
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(`Producto "${result.data!.name}" creado`);
      onProductCreated({
        id: result.data!.id,
        code: result.data!.code,
        name: parsed.data.name,
        cost_price: parsed.data.cost_price,
        vat_rate: parsed.data.vat_rate,
      });
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error('Error al crear producto');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear producto rápido</DialogTitle>
          <DialogDescription>
            Campos mínimos para dar de alta un producto de compra. Podés completar el resto después desde el módulo de productos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="qp-name">Nombre *</Label>
            <Input
              id="qp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Tornillo M8x30"
              autoFocus
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="qp-cost">Precio de costo</Label>
              <Input
                id="qp-cost"
                type="number"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
              />
              {errors.cost_price && <p className="text-xs text-destructive">{errors.cost_price}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="qp-vat">IVA %</Label>
              <Input
                id="qp-vat"
                type="number"
                step="0.5"
                value={vatRate}
                onChange={(e) => setVatRate(e.target.value)}
              />
              {errors.vat_rate && <p className="text-xs text-destructive">{errors.vat_rate}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qp-uom">Unidad de medida</Label>
              <Input
                id="qp-uom"
                value={unitOfMeasure}
                onChange={(e) => setUnitOfMeasure(e.target.value)}
                maxLength={20}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creando...' : 'Crear producto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
