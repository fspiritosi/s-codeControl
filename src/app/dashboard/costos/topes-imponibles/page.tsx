import { PanelTopesImponibles } from '@/modules/costos/features/cct/components/PanelTopesImponibles';
import { listarTopes } from '@/modules/costos/features/cct/actions.server';
import { Suspense } from 'react';

async function TopesContent() {
  const topes = await listarTopes();
  return <PanelTopesImponibles topes={topes} />;
}

export default function TopesImponiblesPage() {
  return (
    <div className="p-6">
      <Suspense fallback={<div className="text-muted-foreground text-sm">Cargando topes...</div>}>
        <TopesContent />
      </Suspense>
    </div>
  );
}
