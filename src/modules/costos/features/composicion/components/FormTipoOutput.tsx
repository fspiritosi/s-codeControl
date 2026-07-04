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
import { Plus, Trash2 } from 'lucide-react';
import type {
  BaseComposicion,
  FormulaOutput,
  TipoOutputInput,
  TipoOutputServicioClient,
} from '@/modules/costos/shared/types/composicion.types';

const BASES: { value: BaseComposicion; label: string }[] = [
  { value: 'precio_mensual', label: 'Precio mensual' },
  { value: 'total_directo', label: 'Total costo directo' },
  { value: 'total_con_margenes', label: 'Total con márgenes' },
  { value: 'mod', label: 'MOD' },
  { value: 'ocp', label: 'OCP' },
  { value: 'equipos', label: 'Equipos' },
  { value: 'combustible', label: 'Combustible' },
];

const TIPOS: { value: FormulaOutput['tipo']; label: string }[] = [
  { value: 'precio_div_kms_x_factor', label: 'Precio ÷ km × factor' },
  { value: 'pct_sobre_precio', label: '% sobre el precio (descuento/recargo)' },
  { value: 'base_div_divisor', label: 'Base × factor ÷ divisor' },
  { value: 'precio_ponderado_div_divisor', label: 'Precio × ponderación ÷ divisor' },
];

type ComponenteState = { base: BaseComposicion; factor: string };

type FormState = {
  codigo: string;
  nombre: string;
  tipo: FormulaOutput['tipo'];
  kms_base: string;
  factor: string;
  porcentaje: string;
  modo: 'descuento' | 'recargo';
  base: BaseComposicion;
  divisor: string;
  factor_previo: string;
  componentes: ComponenteState[];
};

function estadoInicial(output?: TipoOutputServicioClient): FormState {
  const base: FormState = {
    codigo: output?.codigo ?? '',
    nombre: output?.nombre ?? '',
    tipo: 'precio_div_kms_x_factor',
    kms_base: '',
    factor: '',
    porcentaje: '',
    modo: 'descuento',
    base: 'precio_mensual',
    divisor: '',
    factor_previo: '',
    componentes: [{ base: 'mod', factor: '1' }],
  };
  const f = output?.formula;
  if (!f) return base;
  base.tipo = f.tipo;
  if (f.tipo === 'precio_div_kms_x_factor') {
    base.kms_base = String(f.kms_base);
    base.factor = String(f.factor);
  } else if (f.tipo === 'pct_sobre_precio') {
    base.porcentaje = String(f.porcentaje);
    base.modo = f.modo;
  } else if (f.tipo === 'base_div_divisor') {
    base.base = f.base;
    base.divisor = String(f.divisor);
    base.factor_previo = f.factor_previo != null ? String(f.factor_previo) : '';
  } else if (f.tipo === 'precio_ponderado_div_divisor') {
    base.divisor = String(f.divisor);
    base.componentes = f.componentes.map((c) => ({ base: c.base, factor: String(c.factor) }));
  }
  return base;
}

function construirFormula(s: FormState): FormulaOutput {
  switch (s.tipo) {
    case 'precio_div_kms_x_factor':
      return { tipo: s.tipo, kms_base: Number(s.kms_base), factor: Number(s.factor) };
    case 'pct_sobre_precio':
      return { tipo: s.tipo, porcentaje: Number(s.porcentaje), modo: s.modo };
    case 'base_div_divisor':
      return {
        tipo: s.tipo,
        base: s.base,
        divisor: Number(s.divisor),
        ...(s.factor_previo ? { factor_previo: Number(s.factor_previo) } : {}),
      };
    case 'precio_ponderado_div_divisor':
      return {
        tipo: s.tipo,
        divisor: Number(s.divisor),
        componentes: s.componentes.map((c) => ({ base: c.base, factor: Number(c.factor) })),
      };
  }
}

interface Props {
  output?: TipoOutputServicioClient;
  onSubmit: (input: TipoOutputInput) => Promise<void>;
  onCancel: () => void;
}

export function FormTipoOutput({ output, onSubmit, onCancel }: Props) {
  const [s, setS] = useState<FormState>(() => estadoInicial(output));
  const [loading, setLoading] = useState(false);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setS((prev) => ({ ...prev, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ codigo: s.codigo, nombre: s.nombre, formula: construirFormula(s) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="codigo">Código</Label>
          <Input id="codigo" placeholder="KM_EXCEDENTE" value={s.codigo} onChange={(e) => set('codigo', e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" placeholder="Km excedente" value={s.nombre} onChange={(e) => set('nombre', e.target.value)} required />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Tipo de fórmula</Label>
        <Select value={s.tipo} onValueChange={(v) => set('tipo', v as FormulaOutput['tipo'])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIPOS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Campos dinámicos según el tipo */}
      {s.tipo === 'precio_div_kms_x_factor' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="kms_base">Km base</Label>
            <Input id="kms_base" type="number" step="any" value={s.kms_base} onChange={(e) => set('kms_base', e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="factor">Factor</Label>
            <Input id="factor" type="number" step="any" value={s.factor} onChange={(e) => set('factor', e.target.value)} required />
          </div>
        </div>
      )}

      {s.tipo === 'pct_sobre_precio' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="porcentaje">Porcentaje (0–1)</Label>
            <Input id="porcentaje" type="number" step="any" min="0" max="1" value={s.porcentaje} onChange={(e) => set('porcentaje', e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Modo</Label>
            <Select value={s.modo} onValueChange={(v) => set('modo', v as 'descuento' | 'recargo')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="descuento">Descuento</SelectItem>
                <SelectItem value="recargo">Recargo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {s.tipo === 'base_div_divisor' && (
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Base</Label>
            <Select value={s.base} onValueChange={(v) => set('base', v as BaseComposicion)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BASES.map((b) => (
                  <SelectItem key={b.value} value={b.value}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="factor_previo">Factor previo</Label>
            <Input id="factor_previo" type="number" step="any" placeholder="1" value={s.factor_previo} onChange={(e) => set('factor_previo', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="divisor">Divisor</Label>
            <Input id="divisor" type="number" step="any" value={s.divisor} onChange={(e) => set('divisor', e.target.value)} required />
          </div>
        </div>
      )}

      {s.tipo === 'precio_ponderado_div_divisor' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="divisor">Divisor</Label>
            <Input id="divisor" type="number" step="any" value={s.divisor} onChange={(e) => set('divisor', e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Componentes (proporción sobre costo directo)</Label>
            {s.componentes.map((c, i) => (
              <div key={i} className="flex gap-2 items-end">
                <Select
                  value={c.base}
                  onValueChange={(v) =>
                    setS((prev) => ({
                      ...prev,
                      componentes: prev.componentes.map((x, j) => (j === i ? { ...x, base: v as BaseComposicion } : x)),
                    }))
                  }
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BASES.map((b) => (
                      <SelectItem key={b.value} value={b.value}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  step="any"
                  className="w-24"
                  placeholder="factor"
                  value={c.factor}
                  onChange={(e) =>
                    setS((prev) => ({
                      ...prev,
                      componentes: prev.componentes.map((x, j) => (j === i ? { ...x, factor: e.target.value } : x)),
                    }))
                  }
                  required
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 text-destructive"
                  onClick={() => setS((prev) => ({ ...prev, componentes: prev.componentes.filter((_, j) => j !== i) }))}
                  disabled={s.componentes.length <= 1}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setS((prev) => ({ ...prev, componentes: [...prev.componentes, { base: 'mod', factor: '1' }] }))}
            >
              <Plus className="h-3.5 w-3.5" /> Agregar componente
            </Button>
          </div>
        </div>
      )}

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
