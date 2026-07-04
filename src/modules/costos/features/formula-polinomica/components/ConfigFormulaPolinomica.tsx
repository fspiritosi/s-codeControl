'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrencyARS } from '@/shared/lib/utils/formatters';
import { formatPeriodoLabel } from '@/modules/costos/shared/utils/periodo';
import { updateFormula } from '../actions.server';
import type { FormulaClient } from '@/modules/costos/shared/types/formula-polinomica.types';

export function ConfigFormulaPolinomica({ formula }: { formula: FormulaClient }) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({
    descripcion: formula.descripcion ?? '',
    fecha_base: formula.fecha_base,
    precio_base: String(formula.precio_base),
  });
  const [loading, setLoading] = useState(false);

  async function guardar() {
    setLoading(true);
    try {
      await updateFormula(formula.id, {
        descripcion: form.descripcion || undefined,
        fecha_base: form.fecha_base,
        precio_base: Number(form.precio_base),
      });
      toast.success('Configuración actualizada.');
      setEditando(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Configuración</CardTitle>
        {!editando ? (
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditando(true)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" onClick={guardar} disabled={loading}>
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditando(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {!editando ? (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Precio base</span>
              <span className="font-mono font-medium">{formatCurrencyARS(formula.precio_base)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Mes base</span>
              <span className="capitalize">{formatPeriodoLabel(formula.fecha_base)}</span>
            </div>
            {formula.descripcion && <p className="text-xs text-muted-foreground pt-1">{formula.descripcion}</p>}
          </>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="precio_base">Precio base (costo directo)</Label>
              <Input id="precio_base" type="number" step="any" value={form.precio_base} onChange={(e) => setForm((f) => ({ ...f, precio_base: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fecha_base">Mes base</Label>
              <Input id="fecha_base" type="month" value={form.fecha_base} onChange={(e) => setForm((f) => ({ ...f, fecha_base: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="descripcion">Descripción</Label>
              <Input id="descripcion" value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
