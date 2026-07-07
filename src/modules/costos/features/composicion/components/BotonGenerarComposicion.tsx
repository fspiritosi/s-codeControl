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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { persistirComposicion } from '../actions.server';

type ServicioOption = { id: string; nombre: string };

interface Props {
  servicios: ServicioOption[];
  /** Servicio preseleccionado (cuando se genera desde el detalle de un servicio). */
  servicioId?: string;
  /** Período por defecto (YYYY-MM). */
  periodoDefault?: string;
  triggerLabel?: string;
}

export function BotonGenerarComposicion({ servicios, servicioId, periodoDefault, triggerLabel = 'Nueva composición' }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [servicio, setServicio] = useState(servicioId ?? '');
  const [periodo, setPeriodo] = useState(periodoDefault ?? '');
  const [loading, setLoading] = useState(false);

  const fijo = !!servicioId;

  async function generar(e: React.FormEvent) {
    e.preventDefault();
    if (!servicio || !/^\d{4}-\d{2}$/.test(periodo)) {
      toast.error('Seleccioná un servicio y un período válido (YYYY-MM).');
      return;
    }
    setLoading(true);
    try {
      const { id } = await persistirComposicion(servicio, periodo);
      toast.success('Composición generada.');
      setOpen(false);
      router.push(`/dashboard/costos/composicion/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al generar la composición');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generar composición</DialogTitle>
        </DialogHeader>
        <form onSubmit={generar} className="space-y-4 pt-2">
          {!fijo && (
            <div className="space-y-1.5">
              <Label>Servicio</Label>
              <Select value={servicio} onValueChange={setServicio}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar servicio" />
                </SelectTrigger>
                <SelectContent>
                  {servicios.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="periodo">Período</Label>
            <Input id="periodo" type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} required />
            <p className="text-xs text-muted-foreground">
              Se calcula con las fuentes vigentes (MOD, OCP, equipos y combustible del período).
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Generando...' : 'Generar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
