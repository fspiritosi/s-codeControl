import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getCostoTipoEquipo } from '@/modules/costos/features/tipos-equipo/actions.server';
import { TablaItemsCostoTipo } from '@/modules/costos/features/tipos-equipo/components/TablaItemsCostoTipo';
import { BotonRefrescarPrecios } from '@/modules/costos/features/tipos-equipo/components/BotonRefrescarPrecios';
import { getProductsByCompany } from '@/modules/products/features/list/actions.server';
import BackButton from '@/shared/components/common/BackButton';

interface Props {
  params: Promise<{ typeId: string }>;
}

async function DetalleContent({ typeId }: { typeId: string }) {
  const [detalle, productosRaw] = await Promise.all([
    getCostoTipoEquipo(typeId),
    getProductsByCompany(),
  ]);
  if (!detalle) return notFound();

  const productos = productosRaw.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    cost_price: Number(p.cost_price),
  }));

  const todos = [...detalle.accesorios, ...detalle.mantenimiento];
  const vinculados = todos.filter((i) => i.product_id).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{detalle.nombre}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {detalle.equipos_count} {detalle.equipos_count === 1 ? 'equipo' : 'equipos'} de este tipo ·
            estos valores aplican a todos ellos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BotonRefrescarPrecios perfilId={detalle.perfil_id} vinculados={vinculados} />
          <BackButton />
        </div>
      </div>

      <TablaItemsCostoTipo
        clase="ACCESORIO"
        typeId={detalle.type_id}
        perfilId={detalle.perfil_id}
        items={detalle.accesorios}
        productos={productos}
      />

      <TablaItemsCostoTipo
        clase="MANTENIMIENTO"
        typeId={detalle.type_id}
        perfilId={detalle.perfil_id}
        items={detalle.mantenimiento}
        productos={productos}
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
