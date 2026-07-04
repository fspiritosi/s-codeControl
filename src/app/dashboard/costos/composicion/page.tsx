import { Suspense } from 'react';
import { listComposiciones } from '@/modules/costos/features/composicion/actions.server';
import { listServicios } from '@/modules/costos/features/servicios/actions.server';
import { TablaComposiciones } from '@/modules/costos/features/composicion/components/TablaComposiciones';
import { BotonGenerarComposicion } from '@/modules/costos/features/composicion/components/BotonGenerarComposicion';

async function ComposicionesContent() {
  const [composiciones, servicios] = await Promise.all([listComposiciones(), listServicios()]);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Composiciones de costos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Precio mensual por servicio y período, con márgenes y outputs derivados.
          </p>
        </div>
        <BotonGenerarComposicion servicios={servicios.map((s) => ({ id: s.id, nombre: s.nombre }))} />
      </div>
      <TablaComposiciones composiciones={composiciones} />
    </>
  );
}

export default function ComposicionPage() {
  return (
    <div className="p-6 space-y-6">
      <Suspense fallback={<div className="text-muted-foreground text-sm">Cargando composiciones...</div>}>
        <ComposicionesContent />
      </Suspense>
    </div>
  );
}
