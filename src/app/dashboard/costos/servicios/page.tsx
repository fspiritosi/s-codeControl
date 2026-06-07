import { Suspense } from 'react';
import { listServicios, getServicioFormData } from '@/modules/costos/features/servicios/actions.server';
import { TablaServicios } from '@/modules/costos/features/servicios/components/TablaServicios';
import { FormServicio } from '@/modules/costos/features/servicios/components/FormServicio';

async function ServiciosContent() {
  const [servicios, formData] = await Promise.all([listServicios(), getServicioFormData()]);
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Servicios / contratos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Mano de obra, otros costos de personal y equipos por servicio.
          </p>
        </div>
        <FormServicio customers={formData.customers} ccts={formData.ccts} />
      </div>
      <TablaServicios servicios={servicios} />
    </>
  );
}

export default function ServiciosPage() {
  return (
    <div className="p-6 space-y-6">
      <Suspense fallback={<div className="text-muted-foreground text-sm">Cargando servicios...</div>}>
        <ServiciosContent />
      </Suspense>
    </div>
  );
}
