'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { refrescarPreciosDesdeAlmacen } from '../actions.server';
import { formatCurrencyARS } from '@/shared/lib/utils/formatters';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  perfilId: string | null;
  /** Cantidad de ítems con producto vinculado: si es 0, no hay nada que refrescar. */
  vinculados: number;
}

export function BotonRefrescarPrecios({ perfilId, vinculados }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!perfilId) return;
    setLoading(true);
    try {
      const { actualizados, delta_total } = await refrescarPreciosDesdeAlmacen(perfilId);
      if (actualizados === 0) {
        toast.info('Los precios ya estaban actualizados');
      } else {
        const signo = delta_total > 0 ? '+' : '';
        toast.success(
          `${actualizados} ${actualizados === 1 ? 'precio actualizado' : 'precios actualizados'} · ${signo}${formatCurrencyARS(delta_total)} anual`
        );
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al refrescar precios');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="gap-1.5"
      disabled={loading || !perfilId || vinculados === 0}
      onClick={handleClick}
      title={vinculados === 0 ? 'No hay ítems vinculados a almacén' : undefined}
    >
      <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Actualizando...' : 'Actualizar precios desde almacén'}
    </Button>
  );
}
