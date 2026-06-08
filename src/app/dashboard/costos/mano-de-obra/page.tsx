import { Suspense } from 'react';
import { listAsignacionesMODEmpresa } from '@/modules/costos/features/mod/actions.server';
import { TablaMODTransversal } from '@/modules/costos/features/mod/components/TablaMODTransversal';

async function Content() {
  const rows = await listAsignacionesMODEmpresa();
  return <TablaMODTransversal rows={rows} />;
}

export default function ManoDeObraPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mano de obra</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Todas las asignaciones de choferes por servicio.
        </p>
      </div>
      <Suspense fallback={<div className="text-muted-foreground text-sm">Cargando...</div>}>
        <Content />
      </Suspense>
    </div>
  );
}
