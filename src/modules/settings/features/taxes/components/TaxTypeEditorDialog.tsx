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
import { Textarea } from '@/shared/components/ui/textarea';
import { Switch } from '@/shared/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { upsertTaxType } from '../actions.server';
import {
  TAX_CALCULATION_BASE_LABELS,
  TAX_KIND_LABELS,
  TAX_SCOPE_LABELS,
  type TaxTypeData,
} from '../types';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** undefined = create; TaxTypeData = edit */
  taxType?: TaxTypeData;
  /** Forzar el kind cuando se crea desde una sub-tab. */
  defaultKind?: 'RETENTION' | 'PERCEPTION';
}

export function TaxTypeEditorDialog({ open, onOpenChange, taxType, defaultKind }: Props) {
  const router = useRouter();
  const isEdit = !!taxType;
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    code: '',
    name: '',
    kind: (defaultKind ?? 'RETENTION') as 'RETENTION' | 'PERCEPTION',
    scope: 'NATIONAL' as 'NATIONAL' | 'PROVINCIAL' | 'MUNICIPAL',
    jurisdiction: '',
    calculation_base: 'NET' as 'NET' | 'TOTAL' | 'VAT',
    default_rate: '',
    min_taxable_amount: '',
    is_active: true,
    notes: '',
  });

  useEffect(() => {
    if (!open) return;
    if (taxType) {
      setForm({
        code: taxType.code,
        name: taxType.name,
        kind: taxType.kind,
        scope: taxType.scope,
        jurisdiction: taxType.jurisdiction ?? '',
        calculation_base: taxType.calculation_base,
        default_rate: String(taxType.default_rate),
        min_taxable_amount:
          taxType.min_taxable_amount !== null ? String(taxType.min_taxable_amount) : '',
        is_active: taxType.is_active,
        notes: taxType.notes ?? '',
      });
    } else {
      setForm((f) => ({
        ...f,
        code: '',
        name: '',
        kind: defaultKind ?? f.kind,
        scope: 'NATIONAL',
        jurisdiction: '',
        calculation_base: 'NET',
        default_rate: '',
        min_taxable_amount: '',
        is_active: true,
        notes: '',
      }));
    }
  }, [open, taxType, defaultKind]);

  const handleSubmit = () => {
    const rate = parseFloat(form.default_rate);
    if (Number.isNaN(rate)) {
      toast.error('Ingresá una alícuota válida');
      return;
    }
    const min =
      form.min_taxable_amount.trim() === ''
        ? null
        : parseFloat(form.min_taxable_amount);
    if (min !== null && Number.isNaN(min)) {
      toast.error('El mínimo debe ser un número');
      return;
    }

    startTransition(async () => {
      const r = await upsertTaxType({
        id: taxType?.id,
        code: form.code,
        name: form.name,
        kind: form.kind,
        scope: form.scope,
        jurisdiction: form.jurisdiction || null,
        calculation_base: form.calculation_base,
        default_rate: rate,
        min_taxable_amount: min,
        is_active: form.is_active,
        notes: form.notes || null,
      });
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success(isEdit ? 'Tipo actualizado' : 'Tipo creado');
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar tipo' : 'Nuevo tipo de impuesto'}</DialogTitle>
          <DialogDescription>
            Configurá el tipo, alícuota default y base de cálculo. Estos valores se usan
            como punto de partida cuando se aplica al cargar facturas o al pagar OPs.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="tt-kind">Tipo</Label>
            <Select
              value={form.kind}
              onValueChange={(v: 'RETENTION' | 'PERCEPTION') =>
                setForm((f) => ({ ...f, kind: v }))
              }
            >
              <SelectTrigger id="tt-kind">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TAX_KIND_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="tt-code">Código</Label>
            <Input
              id="tt-code"
              placeholder="RET_IIBB_NEU"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            />
          </div>

          <div className="col-span-2 grid gap-1.5">
            <Label htmlFor="tt-name">Nombre visible</Label>
            <Input
              id="tt-name"
              placeholder="Retención IIBB Neuquén"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="tt-scope">Alcance</Label>
            <Select
              value={form.scope}
              onValueChange={(v: 'NATIONAL' | 'PROVINCIAL' | 'MUNICIPAL') =>
                setForm((f) => ({ ...f, scope: v }))
              }
            >
              <SelectTrigger id="tt-scope">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TAX_SCOPE_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="tt-jur">Jurisdicción</Label>
            <Input
              id="tt-jur"
              placeholder={form.scope === 'NATIONAL' ? '— (no aplica)' : 'Neuquén'}
              value={form.jurisdiction}
              onChange={(e) => setForm((f) => ({ ...f, jurisdiction: e.target.value }))}
              disabled={form.scope === 'NATIONAL'}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="tt-base">Base de cálculo</Label>
            <Select
              value={form.calculation_base}
              onValueChange={(v: 'NET' | 'TOTAL' | 'VAT') =>
                setForm((f) => ({ ...f, calculation_base: v }))
              }
            >
              <SelectTrigger id="tt-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TAX_CALCULATION_BASE_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="tt-rate">Alícuota default (%)</Label>
            <Input
              id="tt-rate"
              type="number"
              step="0.0001"
              min="0"
              max="100"
              placeholder="1.00"
              value={form.default_rate}
              onChange={(e) => setForm((f) => ({ ...f, default_rate: e.target.value }))}
            />
          </div>

          <div className="col-span-2 grid gap-1.5">
            <Label htmlFor="tt-min">Mínimo no imponible (opcional)</Label>
            <Input
              id="tt-min"
              type="number"
              step="0.01"
              min="0"
              placeholder="Sin mínimo"
              value={form.min_taxable_amount}
              onChange={(e) =>
                setForm((f) => ({ ...f, min_taxable_amount: e.target.value }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Si la base está por debajo de este monto, no se aplica el impuesto.
            </p>
          </div>

          <div className="col-span-2 grid gap-1.5">
            <Label htmlFor="tt-notes">Notas (opcional)</Label>
            <Textarea
              id="tt-notes"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>

          <div className="col-span-2 flex items-center gap-2">
            <Switch
              id="tt-active"
              checked={form.is_active}
              onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
            />
            <Label htmlFor="tt-active" className="cursor-pointer">
              Activo
            </Label>
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
