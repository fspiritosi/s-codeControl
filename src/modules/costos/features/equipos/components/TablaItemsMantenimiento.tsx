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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  addItemMantenimiento,
  updateItemMantenimiento,
  deleteItemMantenimiento,
} from '../actions.server';
import { ImportarItemsDialog } from './ImportarItemsDialog';
import type { ItemMantenimientoClient } from '@/modules/costos/shared/types/equipo.types';
import { formatCurrencyARS } from '@/shared/lib/utils/formatters';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  costoEquipoId: string;
  items: ItemMantenimientoClient[];
}

const EMPTY = { nombre: '', precio_anual: '' };

export function TablaItemsMantenimiento({ costoEquipoId, items }: Props) {
  const router = useRouter();
  const [openNuevo, setOpenNuevo] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const totalAnual = items.reduce((acc, i) => acc + i.precio_anual, 0);

  function reset() {
    setForm(EMPTY);
  }

  async function handleNuevo(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await addItemMantenimiento(costoEquipoId, {
        nombre: form.nombre,
        precio_anual: Number(form.precio_anual),
        orden: items.length,
      });
      setOpenNuevo(false);
      reset();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  function abrirEdicion(item: ItemMantenimientoClient) {
    setForm({ nombre: item.nombre, precio_anual: String(item.precio_anual) });
    setEditando(item.id);
  }

  async function handleEditar(e: React.FormEvent) {
    e.preventDefault();
    if (!editando) return;
    setLoading(true);
    try {
      await updateItemMantenimiento(editando, {
        nombre: form.nombre,
        precio_anual: Number(form.precio_anual),
      });
      setEditando(null);
      reset();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function handleEliminar(id: string) {
    if (!confirm('¿Eliminar este ítem de mantenimiento?')) return;
    try {
      await deleteItemMantenimiento(id);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  const FormBody = (onSubmit: (e: React.FormEvent) => void, submitLabel: string) => (
    <form onSubmit={onSubmit} className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label htmlFor="item_nombre">Descripción</Label>
        <Input
          id="item_nombre"
          placeholder="Neumáticos 1 juego x año"
          value={form.nombre}
          onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="item_precio">Precio anual</Label>
        <Input
          id="item_precio"
          type="number"
          step="0.01"
          min="0"
          value={form.precio_anual}
          onChange={(e) => setForm((f) => ({ ...f, precio_anual: e.target.value }))}
          required
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setOpenNuevo(false);
            setEditando(null);
            reset();
          }}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : submitLabel}
        </Button>
      </div>
    </form>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Ítems de mantenimiento ({items.length})</CardTitle>
        <div className="flex gap-2">
          <ImportarItemsDialog costoEquipoId={costoEquipoId} />
          <Dialog open={openNuevo} onOpenChange={setOpenNuevo}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Agregar ítem
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Nuevo ítem</DialogTitle>
              </DialogHeader>
              {FormBody(handleNuevo, 'Agregar')}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Dialog open={!!editando} onOpenChange={(v) => { if (!v) { setEditando(null); reset(); } }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Editar ítem</DialogTitle>
            </DialogHeader>
            {FormBody(handleEditar, 'Guardar cambios')}
          </DialogContent>
        </Dialog>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay ítems. Agregá uno o importá una lista.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right w-40">Precio anual</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.nombre}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrencyARS(item.precio_anual)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => abrirEdicion(item)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleEliminar(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2">
                <TableCell className="font-medium">Total anual</TableCell>
                <TableCell className="text-right font-mono font-medium">{formatCurrencyARS(totalAnual)}</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
