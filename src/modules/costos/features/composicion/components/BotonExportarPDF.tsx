'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { getSignedUrlComposicion } from '../actions.server';

export function BotonExportarPDF({ composicionId }: { composicionId: string }) {
  const [loading, setLoading] = useState(false);

  async function exportar() {
    setLoading(true);
    try {
      const url = await getSignedUrlComposicion(composicionId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo generar el PDF');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" variant="outline" className="gap-1.5" onClick={exportar} disabled={loading}>
      <FileDown className="h-3.5 w-3.5" />
      {loading ? 'Generando...' : 'Exportar PDF'}
    </Button>
  );
}
