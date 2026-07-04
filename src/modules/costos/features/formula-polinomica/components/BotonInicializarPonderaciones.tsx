'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { inicializarPonderacionesDesdeComposicion } from '../actions.server';

export function BotonInicializarPonderaciones({ servicioId }: { servicioId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function inicializar() {
    setLoading(true);
    try {
      await inicializarPonderacionesDesdeComposicion(servicioId);
      toast.success('Fórmula inicializada desde la composición más reciente.');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al inicializar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" className="gap-1.5" onClick={inicializar} disabled={loading}>
      <Wand2 className="h-3.5 w-3.5" />
      {loading ? 'Inicializando...' : 'Inicializar desde composición'}
    </Button>
  );
}
