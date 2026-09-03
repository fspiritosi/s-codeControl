'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Checkbox } from '@/shared/components/ui/checkbox';
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
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { createConcepto, updateConcepto } from '../actions.server';
import type {
  ClaseCalculoConceptoEquipo,
  ConceptoEquipoClient,
} from '@/modules/costos/shared/types/concepto.types';
import type { ClaseItemCosto } from '@/modules/costos/shared/utils/calcular-costo-equipo';

export type ProductoOption = { id: string; code: string; name: string; cost_price: number };
export type IndiceOption = { id: string; nombre: string };

interface Props {
  open: boolean;
  onClose: () => void;
  /** Si viene, el formulario edita ese concepto; si no, crea uno nuevo. */
  concepto?: ConceptoEquipoClient;
  /** Catálogo completo: alimenta los selectores de concepto base. */
  conceptos: ConceptoEquipoClient[];
  productos: ProductoOption[];
  indices: IndiceOption[];
  onGuardado: () => void;
}

const CLASES_CALCULO: { value: ClaseCalculoConceptoEquipo; label: string }[] = [
  { value: 'FIJO', label: 'Monto fijo' },
  { value: 'PCT_VALOR_EQUIPO', label: '% del valor del equipo' },
  { value: 'PCT_CONCEPTO', label: '% de otro concepto' },
  { value: 'PCT_SUMA_CONCEPTOS', label: '% de la suma de varios conceptos' },
  { value: 'POR_KM', label: 'Monto por kilómetro' },
];

const BASES: { value: string; label: string }[] = [
  { value: 'VALOR_COMPRA', label: 'Valor de compra' },
  { value: 'VALOR_COMPRA_MAS_ACCESORIOS', label: 'Valor de compra más accesorios' },
  { value: 'VALOR_RESIDUAL', label: 'Valor residual' },
];

/**
 * Los porcentajes viven en la base como fracción (0,17) y en la pantalla como porcentaje (17).
 * La conversión vive sólo acá: el resto del sistema ve siempre la fracción.
 * `toPrecision` limpia la basura del punto flotante (0,17 × 100 = 17,000000000000002).
 */
function aPorcentaje(fraccion: unknown): string {
  const n = Number(fraccion ?? 0);
  if (!Number.isFinite(n) || n === 0) return '';
  return String(Number((n * 100).toPrecision(12)));
}

function aFraccion(porcentaje: string): number {
  const n = Number(porcentaje);
  if (!Number.isFinite(n)) return NaN;
  return Number((n / 100).toPrecision(12));
}

const VACIO = {
  nombre: '',
  clase: 'MANTENIMIENTO' as ClaseItemCosto,
  clase_calculo: 'FIJO' as ClaseCalculoConceptoEquipo,
  cantidad: '1',
  precio_unitario: '',
  product_id: '',
  indice_id: '',
  porcentaje: '',
  base: 'VALOR_COMPRA',
  concepto_codigo: '',
  conceptos_codigos: [] as string[],
  monto_por_km: '',
};

export function FormConcepto({
  open,
  onClose,
  concepto,
  conceptos,
  productos,
  indices,
  onGuardado,
}: Props) {
  const [form, setForm] = useState(VACIO);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (concepto) {
      const p = concepto.parametros;
      setForm({
        nombre: concepto.nombre,
        clase: concepto.clase,
        clase_calculo: concepto.clase_calculo,
        cantidad: String(p.cantidad ?? '1'),
        precio_unitario: String(p.precio_unitario ?? ''),
        product_id: concepto.product_id ?? '',
        indice_id: concepto.indice_id ?? '',
        porcentaje: aPorcentaje(p.pct),
        base: String(p.base ?? 'VALOR_COMPRA'),
        concepto_codigo: String(p.concepto_codigo ?? ''),
        conceptos_codigos: Array.isArray(p.conceptos_codigos)
          ? (p.conceptos_codigos as string[])
          : [],
        monto_por_km: String(p.monto_por_km ?? ''),
      });
    } else {
      setForm(VACIO);
    }
    setError('');
  }, [concepto, open]);

  // Un concepto no puede ser base de sí mismo: el motor lo rechazaría como ciclo.
  const basesPosibles = conceptos.filter((c) => c.id !== concepto?.id);
  const opcionesConceptos = basesPosibles.map((c) => ({
    value: c.codigo,
    label: `${c.nombre} · ${c.descripcion_calculo}`,
  }));
  const opcionesProductos = productos.map((p) => ({
    value: p.id,
    label: `${p.code} · ${p.name}`,
  }));

  function elegirProducto(productId: string) {
    const p = productos.find((x) => x.id === productId);
    setForm((f) => ({
      ...f,
      product_id: productId,
      nombre: f.nombre || (p?.name ?? ''),
      precio_unitario: p ? String(p.cost_price) : f.precio_unitario,
    }));
  }

  function toggleConceptoBase(codigo: string) {
    setForm((f) => ({
      ...f,
      conceptos_codigos: f.conceptos_codigos.includes(codigo)
        ? f.conceptos_codigos.filter((c) => c !== codigo)
        : [...f.conceptos_codigos, codigo],
    }));
  }

  function armarParametros(): Record<string, unknown> {
    switch (form.clase_calculo) {
      case 'FIJO':
        return {
          cantidad: Number(form.cantidad),
          precio_unitario: Number(form.precio_unitario),
        };
      case 'PCT_VALOR_EQUIPO':
        return { pct: aFraccion(form.porcentaje), base: form.base };
      case 'PCT_CONCEPTO':
        return { pct: aFraccion(form.porcentaje), concepto_codigo: form.concepto_codigo };
      case 'PCT_SUMA_CONCEPTOS':
        return { pct: aFraccion(form.porcentaje), conceptos_codigos: form.conceptos_codigos };
      case 'POR_KM':
        return { monto_por_km: Number(form.monto_por_km) };
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Producto e índice sólo tienen sentido en un concepto de monto fijo.
      const esFijo = form.clase_calculo === 'FIJO';
      const datos = {
        nombre: form.nombre,
        clase: form.clase,
        clase_calculo: form.clase_calculo,
        parametros: armarParametros(),
        product_id: esFijo && form.product_id ? form.product_id : null,
        indice_id: esFijo && form.indice_id ? form.indice_id : null,
      };
      if (concepto) {
        await updateConcepto(concepto.id, datos);
      } else {
        await createConcepto(datos);
      }
      onGuardado();
      onClose();
    } catch (err) {
      // Los mensajes de ciclo y de referencia colgada ya llegan legibles desde el motor.
      setError(err instanceof Error ? err.message : 'Error al guardar el concepto');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{concepto ? 'Editar concepto' : 'Nuevo concepto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="concepto_nombre">Nombre</Label>
            <Input
              id="concepto_nombre"
              placeholder="Patentes"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Clase</Label>
              <Select
                value={form.clase}
                onValueChange={(v) => setForm((f) => ({ ...f, clase: v as ClaseItemCosto }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACCESORIO">Accesorio</SelectItem>
                  <SelectItem value="MANTENIMIENTO">Mantenimiento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Cómo se calcula</Label>
              <Select
                value={form.clase_calculo}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, clase_calculo: v as ClaseCalculoConceptoEquipo }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CLASES_CALCULO.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.clase_calculo === 'FIJO' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="concepto_cantidad">
                    {form.clase === 'ACCESORIO' ? 'Cantidad' : 'Cantidad anual'}
                  </Label>
                  <Input
                    id="concepto_cantidad" type="number" step="0.001" min="0.001"
                    value={form.cantidad}
                    onChange={(e) => setForm((f) => ({ ...f, cantidad: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="concepto_precio">Precio unitario</Label>
                  <Input
                    id="concepto_precio" type="number" step="0.01" min="0"
                    value={form.precio_unitario}
                    onChange={(e) => setForm((f) => ({ ...f, precio_unitario: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Producto de almacén (opcional)</Label>
                <SearchableSelect
                  options={opcionesProductos}
                  value={form.product_id}
                  onValueChange={elegirProducto}
                  placeholder="Sin vincular"
                  searchPlaceholder="Buscar producto..."
                />
                <p className="text-xs text-muted-foreground">
                  Vincularlo permite refrescar el precio desde el almacén.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Índice (opcional)</Label>
                <SearchableSelect
                  options={indices.map((i) => ({ value: i.id, label: i.nombre }))}
                  value={form.indice_id}
                  onValueChange={(v) => setForm((f) => ({ ...f, indice_id: v }))}
                  placeholder="Sin índice"
                  searchPlaceholder="Buscar índice..."
                />
                <p className="text-xs text-muted-foreground">
                  Permite actualizar el precio con la variación mensual del índice.
                </p>
              </div>
            </>
          )}

          {form.clase_calculo === 'PCT_VALOR_EQUIPO' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="concepto_pct">Porcentaje (%)</Label>
                <Input
                  id="concepto_pct" type="number" step="0.01" min="0" max="100"
                  placeholder="17"
                  value={form.porcentaje}
                  onChange={(e) => setForm((f) => ({ ...f, porcentaje: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Base</Label>
                <Select
                  value={form.base}
                  onValueChange={(v) => setForm((f) => ({ ...f, base: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BASES.map((b) => (
                      <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {form.clase_calculo === 'PCT_CONCEPTO' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="concepto_pct_uno">Porcentaje (%)</Label>
                <Input
                  id="concepto_pct_uno" type="number" step="0.01" min="0" max="100"
                  placeholder="5"
                  value={form.porcentaje}
                  onChange={(e) => setForm((f) => ({ ...f, porcentaje: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Concepto base</Label>
                <SearchableSelect
                  options={opcionesConceptos}
                  value={form.concepto_codigo}
                  onValueChange={(v) => setForm((f) => ({ ...f, concepto_codigo: v }))}
                  placeholder="Elegí un concepto"
                  searchPlaceholder="Buscar concepto..."
                />
              </div>
            </div>
          )}

          {form.clase_calculo === 'PCT_SUMA_CONCEPTOS' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="concepto_pct_suma">Porcentaje (%)</Label>
                <Input
                  id="concepto_pct_suma" type="number" step="0.01" min="0" max="100"
                  placeholder="5"
                  value={form.porcentaje}
                  onChange={(e) => setForm((f) => ({ ...f, porcentaje: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Conceptos base</Label>
                {basesPosibles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Todavía no hay otros conceptos para sumar.
                  </p>
                ) : (
                  <div className="max-h-48 overflow-y-auto rounded border divide-y">
                    {basesPosibles.map((c) => (
                      <label
                        key={c.id}
                        className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer"
                      >
                        <Checkbox
                          checked={form.conceptos_codigos.includes(c.codigo)}
                          onCheckedChange={() => toggleConceptoBase(c.codigo)}
                        />
                        <span className="truncate">{c.nombre}</span>
                        <span className="ml-auto text-xs text-muted-foreground shrink-0">
                          {c.descripcion_calculo}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {form.clase_calculo === 'POR_KM' && (
            <div className="space-y-1.5">
              <Label htmlFor="concepto_km">Monto por kilómetro</Label>
              <Input
                id="concepto_km" type="number" step="0.0001" min="0"
                placeholder="12.5"
                value={form.monto_por_km}
                onChange={(e) => setForm((f) => ({ ...f, monto_por_km: e.target.value }))}
                required
              />
              <p className="text-xs text-muted-foreground">
                Se multiplica por los kilómetros anuales de cada equipo.
              </p>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : concepto ? 'Guardar cambios' : 'Crear concepto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
