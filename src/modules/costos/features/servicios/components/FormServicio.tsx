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
import { createServicio } from '../actions.server';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  customers: { id: string; nombre: string }[];
  ccts: { id: string; codigo: string; nombre: string }[];
}

const MARGENES = [
  { key: 'margen_iibb', label: 'IIBB' },
  { key: 'margen_debcred', label: 'Déb/Créd' },
  { key: 'margen_estructura', label: 'Estructura' },
  { key: 'margen_ganancia', label: 'Ganancia' },
  { key: 'licencia_ordenanza', label: 'Lic. ordenanza' },
] as const;

export function FormServicio({ customers, ccts }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customer_id: '',
    config_cct_id: '',
    nombre: '',
    fecha_inicio: '',
    fecha_fin: '',
    margen_iibb: '0',
    margen_debcred: '0',
    margen_estructura: '0',
    margen_ganancia: '0',
    licencia_ordenanza: '0',
  });

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await createServicio({
        customer_id: form.customer_id,
        config_cct_id: form.config_cct_id,
        nombre: form.nombre,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin || undefined,
        margen_iibb: Number(form.margen_iibb) / 100,
        margen_debcred: Number(form.margen_debcred) / 100,
        margen_estructura: Number(form.margen_estructura) / 100,
        margen_ganancia: Number(form.margen_ganancia) / 100,
        licencia_ordenanza: Number(form.licencia_ordenanza) / 100,
      });
      toast.success('Servicio creado');
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5">
          <Plus className="h-4 w-4" /> Nuevo servicio
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo servicio / contrato</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              placeholder="RDLS-BDT Ómnibus 44+1"
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <Select value={form.customer_id} onValueChange={(v) => set('customer_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>CCT</Label>
              <Select value={form.config_cct_id} onValueChange={(v) => set('config_cct_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {ccts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.codigo} — {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fecha_inicio">Fecha inicio</Label>
              <Input
                id="fecha_inicio"
                type="date"
                value={form.fecha_inicio}
                onChange={(e) => set('fecha_inicio', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fecha_fin">Fecha fin (opcional)</Label>
              <Input
                id="fecha_fin"
                type="date"
                value={form.fecha_fin}
                onChange={(e) => set('fecha_fin', e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Márgenes comerciales (%)</Label>
            <div className="grid grid-cols-5 gap-2 mt-1.5">
              {MARGENES.map((m) => (
                <div key={m.key} className="space-y-1">
                  <Label htmlFor={m.key} className="text-xs">{m.label}</Label>
                  <Input
                    id={m.key}
                    type="number"
                    step="0.01"
                    min="0"
                    value={form[m.key]}
                    onChange={(e) => set(m.key, e.target.value)}
                    className="text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !form.customer_id || !form.config_cct_id}>
              {loading ? 'Creando...' : 'Crear servicio'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
