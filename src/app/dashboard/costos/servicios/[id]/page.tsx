import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import {
  getServicio,
  listAsignacionesEquipo,
} from '@/modules/costos/features/servicios/actions.server';
import {
  listAsignacionesMOD,
  calcularResumenMOD,
  getMODFormData,
} from '@/modules/costos/features/mod/actions.server';
import { listItemsOCP, calcularResumenOCP } from '@/modules/costos/features/ocp/actions.server';
import { listVehiculosConCosto } from '@/modules/costos/features/equipos/actions.server';
import { DetalleServicio } from '@/modules/costos/features/servicios/components/DetalleServicio';
import BackButton from '@/shared/components/common/BackButton';

async function DetalleContent({ id }: { id: string }) {
  const detalle = await getServicio(id);
  if (!detalle) return notFound();

  const periodo = detalle.servicio.fecha_inicio.slice(0, 7); // YYYY-MM

  const [modAsignaciones, modResumen, modFormData, ocpItems, ocpResumen, equipoAsignaciones, vehiculos] =
    await Promise.all([
      listAsignacionesMOD(id),
      calcularResumenMOD(id, periodo),
      getMODFormData(id),
      listItemsOCP(id),
      calcularResumenOCP(id),
      listAsignacionesEquipo(id),
      listVehiculosConCosto(),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{detalle.servicio.nombre}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {detalle.customer_nombre} · CCT {detalle.cct_codigo} — {detalle.cct_nombre}
          </p>
        </div>
        <BackButton />
      </div>

      <DetalleServicio
        detalle={detalle}
        mod={{ asignaciones: modAsignaciones, resumen: modResumen, formData: modFormData }}
        ocp={{ items: ocpItems, resumen: ocpResumen }}
        equipos={{
          asignaciones: equipoAsignaciones,
          vehiculos: vehiculos.map((v) => ({
            id: v.id,
            interno: v.interno,
            dominio: v.dominio,
            marca: v.marca,
            modelo: v.modelo,
            tiene_costo: v.tiene_costo,
          })),
        }}
      />
    </div>
  );
}

export default async function ServicioDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="p-6">
      <Suspense fallback={<div className="text-muted-foreground text-sm">Cargando servicio...</div>}>
        <DetalleContent id={id} />
      </Suspense>
    </div>
  );
}
