import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getComposicionView } from '@/modules/costos/features/composicion/actions.server';
import { PantallaComposicion } from '@/modules/costos/features/composicion/components/PantallaComposicion';
import BackButton from '@/shared/components/common/BackButton';

async function DetalleContent({ id }: { id: string }) {
  const view = await getComposicionView(id);
  if (!view) return notFound();

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <BackButton />
      </div>
      <PantallaComposicion view={view} />
    </div>
  );
}

export default async function ComposicionDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="p-6">
      <Suspense fallback={<div className="text-muted-foreground text-sm">Cargando composición...</div>}>
        <DetalleContent id={id} />
      </Suspense>
    </div>
  );
}
