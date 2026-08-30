import { Suspense } from 'react';
import { listTiposEquipoConCosto } from '@/modules/costos/features/tipos-equipo/actions.server';
import { TablaTiposEquipo } from '@/modules/costos/features/tipos-equipo/components/TablaTiposEquipo';

async function TiposContent() {
  const tipos = await listTiposEquipoConCosto();
  return <TablaTiposEquipo tipos={tipos} />;
}

export default function TiposEquipoPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tipos de equipo</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Accesorios y mantenimiento compartidos por todas las unidades de cada tipo.
        </p>
      </div>
      <Suspense fallback={<div className="text-muted-foreground text-sm">Cargando tipos...</div>}>
        <TiposContent />
      </Suspense>
    </div>
  );
}
