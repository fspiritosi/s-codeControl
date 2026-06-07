import { Suspense } from 'react';
import { listItemsOCPEmpresa } from '@/modules/costos/features/ocp/actions.server';
import { TablaOCPTransversal } from '@/modules/costos/features/ocp/components/TablaOCPTransversal';

async function Content() {
  const rows = await listItemsOCPEmpresa();
  return <TablaOCPTransversal rows={rows} />;
}

export default function OtrosCostosPersonalPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Otros costos de personal</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Vestimenta, EPP, médicos y carnet por servicio.
        </p>
      </div>
      <Suspense fallback={<div className="text-muted-foreground text-sm">Cargando...</div>}>
        <Content />
      </Suspense>
    </div>
  );
}
