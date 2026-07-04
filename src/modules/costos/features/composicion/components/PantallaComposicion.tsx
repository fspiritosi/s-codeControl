'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/shared/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { formatPeriodoLabel } from '@/modules/costos/shared/utils/periodo';
import { ResumenCostoIndustrial } from './ResumenCostoIndustrial';
import { ResumenMargenes } from './ResumenMargenes';
import { ResumenPrecios } from './ResumenPrecios';
import { BotonExportarPDF } from './BotonExportarPDF';
import { persistirComposicion, type ComposicionView } from '../actions.server';

export function PantallaComposicion({ view }: { view: ComposicionView }) {
  const router = useRouter();
  const { meta, detalle } = view;
  const [recalculando, setRecalculando] = useState(false);

  async function recalcular() {
    setRecalculando(true);
    try {
      const { detalle: nuevo } = await persistirComposicion(meta.servicio_id, meta.periodo);
      if (Math.abs(nuevo.precio_mensual - meta.precio_mensual) > 0.01) {
        toast.warning(
          `El precio recalculado difiere del guardado (antes ${meta.precio_mensual.toLocaleString('es-AR')}, ahora ${nuevo.precio_mensual.toLocaleString('es-AR')}).`
        );
      } else {
        toast.success('Composición actualizada. No hubo cambios en el precio.');
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al recalcular');
    } finally {
      setRecalculando(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Composición — {formatPeriodoLabel(meta.periodo)}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            <Link href={`/dashboard/costos/servicios/${meta.servicio_id}`} className="hover:underline">
              {meta.servicio_nombre}
            </Link>{' '}
            · {meta.customer_nombre}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={recalcular} disabled={recalculando}>
            <RefreshCw className={`h-3.5 w-3.5 ${recalculando ? 'animate-spin' : ''}`} />
            Recalcular
          </Button>
          <BotonExportarPDF composicionId={meta.id} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ResumenCostoIndustrial detalle={detalle} />
        <ResumenMargenes detalle={detalle} />
        <ResumenPrecios detalle={detalle} />
      </div>
    </div>
  );
}
