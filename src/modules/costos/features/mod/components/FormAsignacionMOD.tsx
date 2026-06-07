'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { addAsignacionMOD, updateAsignacionMOD } from '../actions.server';
import type { AsignacionMODConDetalle } from '@/modules/costos/shared/types/mod.types';
import { toast } from 'sonner';

export interface MODFormData {
  empleados: { id: string; nombre: string }[];
  categorias: { id: string; codigo: string; nombre: string }[];
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  servicioId: string;
  data: MODFormData;
  asignacion: AsignacionMODConDetalle | null;
  onSaved: () => void;
}

const OVERRIDE_FIELDS = [
  { key: 'dias_trabajados', label: 'Días trab.' },
  { key: 'hs_nocturnas', label: 'Hs noct.' },
  { key: 'hs_extras_50', label: 'Hs ext 50%' },
  { key: 'hs_extras_100', label: 'Hs ext 100%' },
  { key: 'dias_feriado', label: 'Días feriado' },
  { key: 'dias_desarraigo', label: 'Días desarr.' },
] as const;

export function FormAsignacionMOD({ open, onOpenChange, servicioId, data, asignacion, onSaved }: Props) {
  const editando = !!asignacion;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    employee_id: asignacion?.employee_id ?? '',
    categoria_cct_id: asignacion?.categoria_cct_id ?? '',
    antiguedad_anios: asignacion ? String(asignacion.antiguedad_anios) : '0',
    afectacion_pct: asignacion ? String(asignacion.afectacion_pct * 100) : '100',
  });
  const [overrides, setOverrides] = useState<Record<string, string>>(() => {
    const o = asignacion?.overrides_calculo ?? {};
    return Object.fromEntries(OVERRIDE_FIELDS.map((f) => [f.key, o[f.key] != null ? String(o[f.key]) : '']));
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const overrides_calculo: Record<string, number> = {};
      for (const f of OVERRIDE_FIELDS) {
        const v = overrides[f.key];
        if (v !== '' && v != null) overrides_calculo[f.key] = Number(v);
      }
      const payload = {
        employee_id: form.employee_id,
        categoria_cct_id: form.categoria_cct_id,
        antiguedad_anios: parseInt(form.antiguedad_anios || '0'),
        afectacion_pct: Number(form.afectacion_pct) / 100,
        overrides_calculo: Object.keys(overrides_calculo).length ? overrides_calculo : undefined,
      };
      if (editando && asignacion) await updateAsignacionMOD(asignacion.id, payload);
      else await addAsignacionMOD(servicioId, payload);
      toast.success('Asignación guardada');
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar asignación' : 'Nueva asignación de chofer'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Empleado</Label>
            <Select
              value={form.employee_id}
              onValueChange={(v) => setForm((f) => ({ ...f, employee_id: v }))}
              disabled={editando}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {data.empleados.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5 col-span-1">
              <Label>Categoría</Label>
              <Select
                value={form.categoria_cct_id}
                onValueChange={(v) => setForm((f) => ({ ...f, categoria_cct_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="..." />
                </SelectTrigger>
                <SelectContent>
                  {data.categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.codigo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="antiguedad">Antigüedad (años)</Label>
              <Input
                id="antiguedad"
                type="number"
                min="0"
                value={form.antiguedad_anios}
                onChange={(e) => setForm((f) => ({ ...f, antiguedad_anios: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="afectacion">Afectación (%)</Label>
              <Input
                id="afectacion"
                type="number"
                min="0"
                max="100"
                value={form.afectacion_pct}
                onChange={(e) => setForm((f) => ({ ...f, afectacion_pct: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Inputs estimados (overrides)</Label>
            <div className="grid grid-cols-3 gap-2 mt-1.5">
              {OVERRIDE_FIELDS.map((f) => (
                <div key={f.key} className="space-y-1">
                  <Label htmlFor={f.key} className="text-xs">{f.label}</Label>
                  <Input
                    id={f.key}
                    type="number"
                    step="0.01"
                    value={overrides[f.key] ?? ''}
                    onChange={(e) => setOverrides((o) => ({ ...o, [f.key]: e.target.value }))}
                    className="text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !form.employee_id || !form.categoria_cct_id}>
              {loading ? 'Guardando...' : editando ? 'Guardar' : 'Agregar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
