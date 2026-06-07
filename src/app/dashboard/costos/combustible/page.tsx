import { Suspense } from 'react';
import {
  listServiciosCombustible,
  listVehiculosEmpresa,
} from '@/modules/costos/features/combustible/actions.server';
import { CombustiblePanel } from '@/modules/costos/features/combustible/components/CombustiblePanel';

async function CombustibleContent() {
  const [servicios, vehiculos] = await Promise.all([
    listServiciosCombustible(),
    listVehiculosEmpresa(),
  ]);
  return <CombustiblePanel servicios={servicios} vehiculos={vehiculos} />;
}

export default function CombustiblePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Combustible</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Carga mensual de gasoil y urea por servicio y vehículo.
        </p>
      </div>
      <Suspense fallback={<div className="text-muted-foreground text-sm">Cargando combustible...</div>}>
        <CombustibleContent />
      </Suspense>
    </div>
  );
}
