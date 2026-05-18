'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { crearCCT } from '../actions.server';
import { Plus } from 'lucide-react';

export function FormNuevoCCT() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    cct_codigo: '',
    cct_nombre: '',
    vigencia_desde: '',
    descripcion: '',
  });

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const nuevo = await crearCCT(form);
      setOpen(false);
      setForm({ cct_codigo: '', cct_nombre: '', vigencia_desde: '', descripcion: '' });
      router.push(`?cctId=${nuevo.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al crear CCT');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo CCT
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo convenio colectivo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cct_codigo">Código CCT</Label>
              <Input
                id="cct_codigo"
                placeholder="545/08"
                value={form.cct_codigo}
                onChange={(e) => set('cct_codigo', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vigencia_desde">Vigencia desde</Label>
              <Input
                id="vigencia_desde"
                placeholder="2026-01"
                value={form.vigencia_desde}
                onChange={(e) => set('vigencia_desde', e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cct_nombre">Nombre del convenio</Label>
            <Input
              id="cct_nombre"
              placeholder="UOCRA Petroleros"
              value={form.cct_nombre}
              onChange={(e) => set('cct_nombre', e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="descripcion">Descripción (opcional)</Label>
            <Textarea
              id="descripcion"
              placeholder="Paritaria abril 2026 + Acta 3 de junio"
              value={form.descripcion}
              onChange={(e) => set('descripcion', e.target.value)}
              rows={2}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear CCT'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
