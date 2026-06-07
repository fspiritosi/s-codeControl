import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getEquipoParaEdicion } from '@/modules/costos/features/equipos/actions.server';
import { FormCostoEquipo } from '@/modules/costos/features/equipos/components/FormCostoEquipo';
import { TablaItemsMantenimiento } from '@/modules/costos/features/equipos/components/TablaItemsMantenimiento';
import { ResumenCostoEquipo } from '@/modules/costos/features/equipos/components/ResumenCostoEquipo';
import BackButton from '@/shared/components/common/BackButton';

interface Props {
  params: Promise<{ vehicleId: string }>;
}

async function DetalleContent({ vehicleId }: { vehicleId: string }) {
  const detalle = await getEquipoParaEdicion(vehicleId);
  if (!detalle) return notFound();

  const { vehiculo, costo, items, resumen } = detalle;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {vehiculo.marca} {vehiculo.modelo}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Interno {vehiculo.interno}
            {vehiculo.dominio ? ` · ${vehiculo.dominio}` : ''} · {vehiculo.anio}
          </p>
        </div>
        <BackButton />
      </div>

      {resumen && (
        <ResumenCostoEquipo
          amortizacion_mensual={resumen.amortizacion_mensual}
          mantenimiento_mensual={resumen.mantenimiento_mensual}
          costo_mensual={resumen.costo_mensual}
        />
      )}

      <FormCostoEquipo vehicleId={vehiculo.id} costo={costo} />

      {costo ? (
        <TablaItemsMantenimiento costoEquipoId={costo.id} items={items} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Guardá primero los datos de amortización para poder cargar ítems de mantenimiento.
        </p>
      )}
    </div>
  );
}

export default async function EquipoDetallePage({ params }: Props) {
  const { vehicleId } = await params;
  return (
    <div className="p-6">
      <Suspense fallback={<div className="text-muted-foreground text-sm">Cargando equipo...</div>}>
        <DetalleContent vehicleId={vehicleId} />
      </Suspense>
    </div>
  );
}
