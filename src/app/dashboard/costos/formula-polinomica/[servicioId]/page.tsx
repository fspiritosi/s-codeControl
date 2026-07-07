import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getFormula, listPeriodos } from '@/modules/costos/features/formula-polinomica/actions.server';
import { getServicio } from '@/modules/costos/features/servicios/actions.server';
import { PantallaFormula } from '@/modules/costos/features/formula-polinomica/components/PantallaFormula';
import BackButton from '@/shared/components/common/BackButton';

async function FormulaContent({ servicioId }: { servicioId: string }) {
  const [servicio, detalle] = await Promise.all([getServicio(servicioId), getFormula(servicioId)]);
  if (!servicio) return notFound();

  const periodos = detalle ? await listPeriodos(detalle.formula.id) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fórmula polinómica — {servicio.servicio.nombre}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {servicio.customer_nombre} · CCT {servicio.cct_codigo}
          </p>
        </div>
        <BackButton />
      </div>
      <PantallaFormula servicioId={servicioId} detalle={detalle} periodos={periodos} />
    </div>
  );
}

export default async function FormulaDetallePage({ params }: { params: Promise<{ servicioId: string }> }) {
  const { servicioId } = await params;
  return (
    <div className="p-6">
      <Suspense fallback={<div className="text-muted-foreground text-sm">Cargando fórmula...</div>}>
        <FormulaContent servicioId={servicioId} />
      </Suspense>
    </div>
  );
}
