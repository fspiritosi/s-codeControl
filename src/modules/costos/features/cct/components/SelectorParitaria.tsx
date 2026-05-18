'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { clonarParitaria } from '../actions.server';
import type { ConfigCCTClient } from '../../../shared/types/cct.types';
import { Copy } from 'lucide-react';

interface Props {
  cct: ConfigCCTClient;
}

export function SelectorParitaria({ cct }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [vigencia, setVigencia] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleClonar() {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(vigencia)) {
      setError('Formato inválido. Usá YYYY-MM');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const nuevo = await clonarParitaria(cct.id, vigencia);
      setOpen(false);
      router.push(`?cctId=${nuevo.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al clonar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-between border rounded-lg px-4 py-2 bg-muted/30">
      <div>
        <p className="text-sm font-medium">
          {cct.cct_codigo} — {cct.cct_nombre}
        </p>
        <p className="text-xs text-muted-foreground">
          Vigencia: {cct.vigencia_desde}
          {cct.vigencia_hasta ? ` → ${cct.vigencia_hasta}` : ' (activo)'}
          {cct.descripcion ? ` · ${cct.descripcion}` : ''}
        </p>
      </div>
      {cct.is_active && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Copy className="h-3.5 w-3.5" />
              Nueva paritaria
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Nueva paritaria — {cct.cct_codigo}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                Se clonará este CCT con todas sus categorías y conceptos como punto de partida.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="vigencia">Vigencia desde (YYYY-MM)</Label>
                <Input
                  id="vigencia"
                  placeholder="2026-07"
                  value={vigencia}
                  onChange={(e) => setVigencia(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={handleClonar} disabled={loading}>
                  {loading ? 'Clonando...' : 'Clonar y abrir'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
