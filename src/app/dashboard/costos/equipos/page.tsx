import { Suspense } from 'react';
import { listVehiculosConCosto } from '@/modules/costos/features/equipos/actions.server';
import { TablaEquiposCosto } from '@/modules/costos/features/equipos/components/TablaEquiposCosto';

async function EquiposContent() {
  const vehiculos = await listVehiculosConCosto();
  return <TablaEquiposCosto vehiculos={vehiculos} />;
}

export default function EquiposPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Costo de equipos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Amortización y mantenimiento mensual por vehículo.
        </p>
      </div>
      <Suspense fallback={<div className="text-muted-foreground text-sm">Cargando equipos...</div>}>
        <EquiposContent />
      </Suspense>
    </div>
  );
}
