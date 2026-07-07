'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  TIPOS_INDICE,
  TIPO_INDICE_LABELS,
  type ComponenteFormulaClient,
  type ComponenteInput,
  type TipoIndice,
} from '@/modules/costos/shared/types/formula-polinomica.types';

interface Props {
  componente?: ComponenteFormulaClient;
  onSubmit: (input: ComponenteInput) => Promise<void>;
  onCancel: () => void;
}

export function FormComponente({ componente, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState({
    codigo: componente?.codigo ?? '',
    nombre: componente?.nombre ?? '',
    tipo_indice: (componente?.tipo_indice ?? 'cct') as TipoIndice,
    ponderacion: componente ? String(componente.ponderacion) : '',
    valor_indice_base: componente ? String(componente.valor_indice_base) : '',
    fuente_indice: componente?.fuente_indice ?? '',
  });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        codigo: form.codigo,
        nombre: form.nombre,
        tipo_indice: form.tipo_indice,
        ponderacion: Number(form.ponderacion),
        valor_indice_base: Number(form.valor_indice_base),
        fuente_indice: form.fuente_indice || undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="codigo">Código</Label>
          <Input id="codigo" placeholder="I001" value={form.codigo} onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))} required />
        </div>
        <div className="space-y-1.5">
          <Label>Tipo de índice</Label>
          <Select value={form.tipo_indice} onValueChange={(v) => setForm((f) => ({ ...f, tipo_indice: v as TipoIndice }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_INDICE.map((t) => (
                <SelectItem key={t} value={t}>
                  {TIPO_INDICE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" placeholder="Mano de Obra Directa" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="ponderacion">Ponderación (0–1)</Label>
          <Input id="ponderacion" type="number" step="any" min="0" max="1" value={form.ponderacion} onChange={(e) => setForm((f) => ({ ...f, ponderacion: e.target.value }))} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="valor_indice_base">Índice base</Label>
          <Input id="valor_indice_base" type="number" step="any" value={form.valor_indice_base} onChange={(e) => setForm((f) => ({ ...f, valor_indice_base: e.target.value }))} required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fuente_indice">Fuente del índice</Label>
        <Input id="fuente_indice" placeholder="CCT 545/08 UOCRA Petroleros" value={form.fuente_indice} onChange={(e) => setForm((f) => ({ ...f, fuente_indice: e.target.value }))} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}
