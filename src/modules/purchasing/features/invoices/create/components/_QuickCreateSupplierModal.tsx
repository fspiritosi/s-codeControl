'use client';

import { useEffect, useState } from 'react';
import { z } from 'zod';
import { createSupplier } from '@/modules/suppliers/features/list/actions.server';
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

const cuitRegex = /^\d{2}-?\d{8}-?\d{1}$/;

const quickSupplierSchema = z.object({
  business_name: z.string().min(1, 'La razón social es requerida').max(200),
  tax_id: z.string().regex(cuitRegex, 'CUIT inválido (formato: XX-XXXXXXXX-X)'),
  tax_condition: z.enum([
    'RESPONSABLE_INSCRIPTO',
    'MONOTRIBUTISTA',
    'EXENTO',
    'NO_RESPONSABLE',
    'CONSUMIDOR_FINAL',
  ]),
});

type TaxCondition = z.infer<typeof quickSupplierSchema>['tax_condition'];

const TAX_CONDITION_LABELS: Record<TaxCondition, string> = {
  RESPONSABLE_INSCRIPTO: 'Responsable Inscripto',
  MONOTRIBUTISTA: 'Monotributista',
  EXENTO: 'Exento',
  NO_RESPONSABLE: 'No Responsable',
  CONSUMIDOR_FINAL: 'Consumidor Final',
};

export interface QuickCreatedSupplier {
  id: string;
  code: string;
  business_name: string;
  tax_id: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Razón social pre-cargada desde la extracción AI. */
  initialBusinessName?: string | null;
  /** CUIT (solo dígitos) pre-cargado desde la extracción AI. */
  initialCuit?: string | null;
  onSupplierCreated: (supplier: QuickCreatedSupplier) => void;
}

/** Formatea 11 dígitos a XX-XXXXXXXX-X; si no, devuelve tal cual. */
function formatCuit(digits: string): string {
  const clean = digits.replace(/\D/g, '');
  if (clean.length === 11) {
    return `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10)}`;
  }
  return digits;
}

export default function QuickCreateSupplierModal({
  open,
  onOpenChange,
  initialBusinessName,
  initialCuit,
  onSupplierCreated,
}: Props) {
  const [businessName, setBusinessName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [taxCondition, setTaxCondition] = useState<TaxCondition>('RESPONSABLE_INSCRIPTO');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Pre-cargar con lo extraído cada vez que se abre el modal.
  useEffect(() => {
    if (open) {
      setBusinessName(initialBusinessName?.trim() || '');
      setTaxId(initialCuit ? formatCuit(initialCuit) : '');
      setTaxCondition('RESPONSABLE_INSCRIPTO');
      setErrors({});
    }
  }, [open, initialBusinessName, initialCuit]);

  const handleSubmit = async () => {
    setErrors({});
    const parsed = quickSupplierSchema.safeParse({
      business_name: businessName,
      tax_id: taxId,
      tax_condition: taxCondition,
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
      const result = await createSupplier({
        business_name: parsed.data.business_name,
        tax_id: parsed.data.tax_id,
        tax_condition: parsed.data.tax_condition,
      });

      if (result.error || !result.data) {
        toast.error(result.error || 'Error al crear proveedor');
        return;
      }

      toast.success(`Proveedor "${result.data.business_name}" creado`);
      onSupplierCreated({
        id: result.data.id,
        code: result.data.code,
        business_name: result.data.business_name,
        tax_id: result.data.tax_id ?? null,
      });
      onOpenChange(false);
    } catch {
      toast.error('Error al crear proveedor');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear proveedor</DialogTitle>
          <DialogDescription>
            No encontramos un proveedor con este CUIT. Damos de alta los datos mínimos
            (los pre-cargamos desde la factura). Podés completar el resto después desde
            el módulo de proveedores.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="qs-name">Razón social *</Label>
            <Input
              id="qs-name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Ej: Distribuidora del Sur S.A."
              autoFocus
            />
            {errors.business_name && (
              <p className="text-xs text-destructive">{errors.business_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="qs-cuit">CUIT *</Label>
            <Input
              id="qs-cuit"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              placeholder="XX-XXXXXXXX-X"
            />
            {errors.tax_id && <p className="text-xs text-destructive">{errors.tax_id}</p>}
          </div>

          <div className="space-y-2">
            <Label>Condición fiscal *</Label>
            <Select value={taxCondition} onValueChange={(v) => setTaxCondition(v as TaxCondition)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TAX_CONDITION_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.tax_condition && (
              <p className="text-xs text-destructive">{errors.tax_condition}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creando...' : 'Crear proveedor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
