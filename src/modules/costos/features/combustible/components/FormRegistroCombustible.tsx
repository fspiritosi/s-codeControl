'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { upsertRegistroCombustible } from '../actions.server';
import type { RegistroCombustibleClient } from '@/modules/costos/shared/types/combustible.types';
import { toast } from 'sonner';

export interface VehiculoOpt {
  id: string;
  interno: string;
  dominio: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  servicioId: string;
  vehiculos: VehiculoOpt[];
  registro: RegistroCombustibleClient | null;
  onSaved: () => void;
}

export function FormRegistroCombustible({
  open,
  onOpenChange,
  servicioId,
  vehiculos,
  registro,
  onSaved,
}: Props) {
  const editando = !!registro;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    vehicle_id: registro?.vehicle_id ?? '',
    periodo: registro?.periodo ?? '',
    litros_mensuales: registro ? String(registro.litros_mensuales) : '',
    precio_gasoil_lt: registro ? String(registro.precio_gasoil_lt) : '',
    litros_urea: registro ? String(registro.litros_urea) : '0',
    precio_urea_lt: registro ? String(registro.precio_urea_lt) : '0',
  });

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await upsertRegistroCombustible({
        servicio_id: servicioId,
        vehicle_id: form.vehicle_id,
        periodo: form.periodo,
        litros_mensuales: Number(form.litros_mensuales),
        precio_gasoil_lt: Number(form.precio_gasoil_lt),
        litros_urea: Number(form.litros_urea || '0'),
        precio_urea_lt: Number(form.precio_urea_lt || '0'),
      });
      toast.success('Registro guardado');
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar registro' : 'Nuevo registro de combustible'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Vehículo</Label>
              <Select
                value={form.vehicle_id}
                onValueChange={(v) => set('vehicle_id', v)}
                disabled={editando}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {vehiculos.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.interno}
                      {v.dominio ? ` · ${v.dominio}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="periodo">Período</Label>
              <Input
                id="periodo"
                type="month"
                value={form.periodo}
                onChange={(e) => set('periodo', e.target.value)}
                disabled={editando}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="litros_mensuales">Litros gasoil / mes</Label>
              <Input
                id="litros_mensuales"
                type="number"
                step="0.01"
                min="0"
                value={form.litros_mensuales}
                onChange={(e) => set('litros_mensuales', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="precio_gasoil_lt">Precio gasoil / lt</Label>
              <Input
                id="precio_gasoil_lt"
                type="number"
                step="0.01"
                min="0"
                value={form.precio_gasoil_lt}
                onChange={(e) => set('precio_gasoil_lt', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="litros_urea">Litros urea / mes</Label>
              <Input
                id="litros_urea"
                type="number"
                step="0.01"
                min="0"
                value={form.litros_urea}
                onChange={(e) => set('litros_urea', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="precio_urea_lt">Precio urea / lt</Label>
              <Input
                id="precio_urea_lt"
                type="number"
                step="0.01"
                min="0"
                value={form.precio_urea_lt}
                onChange={(e) => set('precio_urea_lt', e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !form.vehicle_id}>
              {loading ? 'Guardando...' : editando ? 'Guardar cambios' : 'Cargar registro'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
