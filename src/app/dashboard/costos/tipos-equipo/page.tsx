import { Suspense } from 'react';
import {
  listTiposCosteados,
  listTiposDisponibles,
} from '@/modules/costos/features/tipos-equipo/actions.server';
import { listConceptos } from '@/modules/costos/features/conceptos/actions.server';
import { TablaTiposEquipo } from '@/modules/costos/features/tipos-equipo/components/TablaTiposEquipo';
import { DialogCrearCostoTipo } from '@/modules/costos/features/tipos-equipo/components/DialogCrearCostoTipo';

async function TiposContent() {
  const [tipos, tiposDisponibles, conceptos] = await Promise.all([
    listTiposCosteados(),
    listTiposDisponibles(),
    listConceptos(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tipos de equipo costeados</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Conceptos de accesorios y mantenimiento compartidos por todas las unidades de cada tipo.
          </p>
        </div>
        <DialogCrearCostoTipo tiposDisponibles={tiposDisponibles} conceptos={conceptos} />
      </div>
      <TablaTiposEquipo tipos={tipos} />
    </div>
  );
}

export default function TiposEquipoPage() {
  return (
    <div className="p-6">
      <Suspense fallback={<div className="text-muted-foreground text-sm">Cargando tipos...</div>}>
        <TiposContent />
      </Suspense>
    </div>
  );
}
