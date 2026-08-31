import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCostoTipoEquipo } from '@/modules/costos/features/tipos-equipo/actions.server';
import { listConceptos } from '@/modules/costos/features/conceptos/actions.server';
import { ConceptosDelTipo } from '@/modules/costos/features/tipos-equipo/components/ConceptosDelTipo';
import { Button } from '@/shared/components/ui/button';
import BackButton from '@/shared/components/common/BackButton';
import { ExternalLink } from 'lucide-react';

interface Props {
  params: Promise<{ typeId: string }>;
}

async function DetalleContent({ typeId }: { typeId: string }) {
  const [detalle, catalogo] = await Promise.all([getCostoTipoEquipo(typeId), listConceptos()]);
  // Sin perfil el tipo no está costeado: no hay nada que mostrar acá.
  if (!detalle) return notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{detalle.nombre}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {detalle.equipos_count} {detalle.equipos_count === 1 ? 'equipo' : 'equipos'} de este
            tipo · {detalle.conceptos_variables}{' '}
            {detalle.conceptos_variables === 1
              ? 'concepto se resuelve por unidad'
              : 'conceptos se resuelven por unidad'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <Link href="/dashboard/costos/conceptos">
              <ExternalLink className="h-3.5 w-3.5" /> Catálogo de conceptos
            </Link>
          </Button>
          <BackButton />
        </div>
      </div>

      <ConceptosDelTipo
        clase="ACCESORIO"
        perfilId={detalle.perfil_id}
        asociados={detalle.accesorios}
        catalogo={catalogo}
        total_fijo={detalle.total_fijo_accesorios}
      />

      <ConceptosDelTipo
        clase="MANTENIMIENTO"
        perfilId={detalle.perfil_id}
        asociados={detalle.mantenimiento}
        catalogo={catalogo}
        total_fijo={detalle.total_fijo_mantenimiento}
      />
    </div>
  );
}

export default async function TipoEquipoDetallePage({ params }: Props) {
  const { typeId } = await params;
  return (
    <div className="p-6">
      <Suspense fallback={<div className="text-muted-foreground text-sm">Cargando tipo...</div>}>
        <DetalleContent typeId={typeId} />
      </Suspense>
    </div>
  );
}
