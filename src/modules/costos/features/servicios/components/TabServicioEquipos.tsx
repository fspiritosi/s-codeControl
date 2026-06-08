'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { asignarEquiposServicio, quitarEquipoServicio } from '../actions.server';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface AsignacionEquipo {
  id: string;
  vehicle_id: string;
  interno: string;
  dominio: string | null;
  vehiculo: string;
  tiene_costo: boolean;
  afectacion_pct: number;
  km_mensuales: number;
}

interface VehiculoOpt {
  id: string;
  interno: string;
  dominio: string | null;
  marca: string;
  modelo: string;
  tiene_costo: boolean;
}

interface Props {
  servicioId: string;
  asignaciones: AsignacionEquipo[];
  vehiculos: VehiculoOpt[];
}

export function TabServicioEquipos({ servicioId, asignaciones, vehiculos }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ vehicle_id: '', afectacion_pct: '100', km_mensuales: '0' });

  const yaAsignados = new Set(asignaciones.map((a) => a.vehicle_id));
  const disponibles = vehiculos.filter((v) => !yaAsignados.has(v.id));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await asignarEquiposServicio(servicioId, [
        {
          vehicle_id: form.vehicle_id,
          afectacion_pct: Number(form.afectacion_pct) / 100,
          km_mensuales: parseInt(form.km_mensuales || '0'),
        },
      ]);
      toast.success('Equipo asignado');
      setOpen(false);
      setForm({ vehicle_id: '', afectacion_pct: '100', km_mensuales: '0' });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function quitar(id: string) {
    if (!confirm('¿Quitar este equipo del servicio?')) return;
    try {
      await quitarEquipoServicio(id);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al quitar');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5" disabled={disponibles.length === 0}>
              <Plus className="h-3.5 w-3.5" /> Asignar equipo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Asignar equipo al servicio</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Vehículo</Label>
                <Select value={form.vehicle_id} onValueChange={(v) => setForm((f) => ({ ...f, vehicle_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {disponibles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.interno} · {v.marca} {v.modelo}
                        {!v.tiene_costo ? ' (sin costo)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="afectacion_pct">Afectación (%)</Label>
                  <Input
                    id="afectacion_pct"
                    type="number"
                    min="0"
                    max="100"
                    value={form.afectacion_pct}
                    onChange={(e) => setForm((f) => ({ ...f, afectacion_pct: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="km_mensuales">Km mensuales</Label>
                  <Input
                    id="km_mensuales"
                    type="number"
                    min="0"
                    value={form.km_mensuales}
                    onChange={(e) => setForm((f) => ({ ...f, km_mensuales: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading || !form.vehicle_id}>
                  {loading ? 'Asignando...' : 'Asignar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {asignaciones.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No hay equipos asignados a este servicio.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Interno</TableHead>
              <TableHead>Vehículo</TableHead>
              <TableHead className="text-right">Afectación</TableHead>
              <TableHead className="text-right">Km/mes</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {asignaciones.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-mono font-medium">{a.interno}</TableCell>
                <TableCell>
                  {a.vehiculo}
                  {a.dominio ? <span className="text-xs text-muted-foreground ml-1">{a.dominio}</span> : null}
                  {!a.tiene_costo && (
                    <Badge variant="secondary" className="ml-2">Sin costo</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">{Math.round(a.afectacion_pct * 100)}%</TableCell>
                <TableCell className="text-right">{a.km_mensuales}</TableCell>
                <TableCell className="text-right">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => quitar(a.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
