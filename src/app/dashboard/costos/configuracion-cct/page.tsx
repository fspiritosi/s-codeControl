import PanelCCT from '@/modules/costos/features/cct/components/PanelCCT';
import { Suspense } from 'react';

interface Props {
  searchParams: Promise<{ cctId?: string }>;
}

export default async function ConfiguracionCCTPage({ searchParams }: Props) {
  const { cctId } = await searchParams;
  return (
    <div className="p-6">
      <Suspense fallback={<div className="text-muted-foreground text-sm">Cargando configurador...</div>}>
        <PanelCCT cctId={cctId} />
      </Suspense>
    </div>
  );
}
