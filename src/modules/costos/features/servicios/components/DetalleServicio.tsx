'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { TabServicioGeneral } from './TabServicioGeneral';
import { TabServicioEquipos } from './TabServicioEquipos';
import { TabServicioMOD } from '@/modules/costos/features/mod/components/TabServicioMOD';
import { TabServicioOCP } from '@/modules/costos/features/ocp/components/TabServicioOCP';
import type { ServicioDetalle } from '@/modules/costos/shared/types/servicio.types';
import type { AsignacionMODConDetalle, ResumenMOD } from '@/modules/costos/shared/types/mod.types';
import type { MODFormData } from '@/modules/costos/features/mod/components/FormAsignacionMOD';
import type { ItemOCPClient, ResumenOCP } from '@/modules/costos/shared/types/ocp.types';

interface Props {
  detalle: ServicioDetalle;
  mod: { asignaciones: AsignacionMODConDetalle[]; resumen: ResumenMOD; formData: MODFormData };
  ocp: { items: ItemOCPClient[]; resumen: ResumenOCP };
  equipos: { asignaciones: any[]; vehiculos: any[] };
}

export function DetalleServicio({ detalle, mod, ocp, equipos }: Props) {
  const servicioId = detalle.servicio.id;

  return (
    <Tabs defaultValue="general">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="mod">MOD</TabsTrigger>
        <TabsTrigger value="ocp">OCP</TabsTrigger>
        <TabsTrigger value="equipos">Equipos</TabsTrigger>
        <TabsTrigger value="composicion" disabled>Composición</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="mt-4">
        <TabServicioGeneral detalle={detalle} />
      </TabsContent>
      <TabsContent value="mod" className="mt-4">
        <TabServicioMOD
          servicioId={servicioId}
          asignaciones={mod.asignaciones}
          resumen={mod.resumen}
          formData={mod.formData}
        />
      </TabsContent>
      <TabsContent value="ocp" className="mt-4">
        <TabServicioOCP servicioId={servicioId} items={ocp.items} resumen={ocp.resumen} />
      </TabsContent>
      <TabsContent value="equipos" className="mt-4">
        <TabServicioEquipos servicioId={servicioId} asignaciones={equipos.asignaciones} vehiculos={equipos.vehiculos} />
      </TabsContent>
    </Tabs>
  );
}
