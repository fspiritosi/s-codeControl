'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { updateServicio } from '../actions.server';
import type { ServicioDetalle } from '@/modules/costos/shared/types/servicio.types';
import { toast } from 'sonner';

const MARGENES = [
  { key: 'margen_iibb', label: 'IIBB' },
  { key: 'margen_debcred', label: 'Déb/Créd' },
  { key: 'margen_estructura', label: 'Estructura' },
  { key: 'margen_ganancia', label: 'Ganancia' },
  { key: 'licencia_ordenanza', label: 'Lic. ordenanza' },
] as const;

export function TabServicioGeneral({ detalle }: { detalle: ServicioDetalle }) {
  const router = useRouter();
  const s = detalle.servicio;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nombre: s.nombre,
    fecha_inicio: s.fecha_inicio,
    fecha_fin: s.fecha_fin ?? '',
    margen_iibb: String(s.margen_iibb * 100),
    margen_debcred: String(s.margen_debcred * 100),
    margen_estructura: String(s.margen_estructura * 100),
    margen_ganancia: String(s.margen_ganancia * 100),
    licencia_ordenanza: String(s.licencia_ordenanza * 100),
  });

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await updateServicio(s.id, {
        nombre: form.nombre,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin || undefined,
        margen_iibb: Number(form.margen_iibb) / 100,
        margen_debcred: Number(form.margen_debcred) / 100,
        margen_estructura: Number(form.margen_estructura) / 100,
        margen_ganancia: Number(form.margen_ganancia) / 100,
        licencia_ordenanza: Number(form.licencia_ordenanza) / 100,
      });
      toast.success('Servicio actualizado');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Datos generales — {detalle.customer_nombre} · CCT {detalle.cct_codigo}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5 md:col-span-1">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fecha_inicio">Fecha inicio</Label>
              <Input id="fecha_inicio" type="date" value={form.fecha_inicio} onChange={(e) => set('fecha_inicio', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fecha_fin">Fecha fin</Label>
              <Input id="fecha_fin" type="date" value={form.fecha_fin} onChange={(e) => set('fecha_fin', e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Márgenes comerciales (%)</Label>
            <div className="grid grid-cols-5 gap-2 mt-1.5">
              {MARGENES.map((m) => (
                <div key={m.key} className="space-y-1">
                  <Label htmlFor={m.key} className="text-xs">{m.label}</Label>
                  <Input
                    id={m.key}
                    type="number"
                    step="0.01"
                    min="0"
                    value={form[m.key]}
                    onChange={(e) => set(m.key, e.target.value)}
                    className="text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
