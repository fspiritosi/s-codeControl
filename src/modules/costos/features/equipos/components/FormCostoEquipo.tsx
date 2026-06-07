'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { upsertCostoEquipo } from '../actions.server';
import type { CostoEquipoClient } from '@/modules/costos/shared/types/equipo.types';
import { toast } from 'sonner';

interface Props {
  vehicleId: string;
  costo: CostoEquipoClient | null;
}

/** Form de alta/edición del costo base de un equipo (amortización). */
export function FormCostoEquipo({ vehicleId, costo }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    valor_compra: costo ? String(costo.valor_compra) : '',
    // se muestra como porcentaje (35), se persiste como fracción (0.35)
    valor_residual_pct: costo ? String(costo.valor_residual_pct * 100) : '35',
    anios_amortizacion: costo ? String(costo.anios_amortizacion) : '5',
    km_anuales: costo ? String(costo.km_anuales) : '0',
    accesorios: costo ? String(costo.accesorios) : '0',
  });

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await upsertCostoEquipo({
        vehicle_id: vehicleId,
        valor_compra: Number(form.valor_compra),
        valor_residual_pct: Number(form.valor_residual_pct) / 100,
        anios_amortizacion: parseInt(form.anios_amortizacion),
        km_anuales: parseInt(form.km_anuales || '0'),
        accesorios: Number(form.accesorios || '0'),
      });
      toast.success('Costo de equipo guardado');
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
        <CardTitle className="text-base">Datos de amortización</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="valor_compra">Valor de compra</Label>
              <Input
                id="valor_compra"
                type="number"
                step="0.01"
                min="0"
                value={form.valor_compra}
                onChange={(e) => set('valor_compra', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="valor_residual_pct">Valor residual (%)</Label>
              <Input
                id="valor_residual_pct"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.valor_residual_pct}
                onChange={(e) => set('valor_residual_pct', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="anios_amortizacion">Años de amortización</Label>
              <Input
                id="anios_amortizacion"
                type="number"
                min="1"
                value={form.anios_amortizacion}
                onChange={(e) => set('anios_amortizacion', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="accesorios">Accesorios</Label>
              <Input
                id="accesorios"
                type="number"
                step="0.01"
                min="0"
                value={form.accesorios}
                onChange={(e) => set('accesorios', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="km_anuales">Km anuales</Label>
              <Input
                id="km_anuales"
                type="number"
                min="0"
                value={form.km_anuales}
                onChange={(e) => set('km_anuales', e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : costo ? 'Guardar cambios' : 'Crear costo de equipo'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
