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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { ResumenOCP } from './ResumenOCP';
import { addItemOCP, updateItemOCP, deleteItemOCP } from '../actions.server';
import {
  GRUPOS_OCP,
  GRUPO_OCP_LABELS,
  type ItemOCPClient,
  type ResumenOCP as ResumenOCPType,
} from '@/modules/costos/shared/types/ocp.types';
import { formatCurrencyARS } from '@/shared/lib/utils/formatters';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  servicioId: string;
  items: ItemOCPClient[];
  resumen: ResumenOCPType;
}

const EMPTY = { grupo: 'vestimenta', concepto: '', costo_anual: '', cantidad_personas: '1' };

export function TabServicioOCP({ servicioId, items, resumen }: Props) {
  const router = useRouter();
  const [openNuevo, setOpenNuevo] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  function reset() {
    setForm(EMPTY);
  }

  async function submit(e: React.FormEvent, isEdit: boolean) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        grupo: form.grupo,
        concepto: form.concepto,
        costo_anual: Number(form.costo_anual),
        cantidad_personas: Number(form.cantidad_personas),
      };
      if (isEdit && editando) await updateItemOCP(editando, payload);
      else await addItemOCP(servicioId, payload);
      setOpenNuevo(false);
      setEditando(null);
      reset();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  function abrirEdicion(item: ItemOCPClient) {
    setForm({
      grupo: item.grupo,
      concepto: item.concepto,
      costo_anual: String(item.costo_anual),
      cantidad_personas: String(item.cantidad_personas),
    });
    setEditando(item.id);
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este ítem OCP?')) return;
    try {
      await deleteItemOCP(id);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  const FormBody = (isEdit: boolean) => (
    <form onSubmit={(e) => submit(e, isEdit)} className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Grupo</Label>
          <Select value={form.grupo} onValueChange={(v) => setForm((f) => ({ ...f, grupo: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GRUPOS_OCP.map((g) => (
                <SelectItem key={g} value={g}>
                  {GRUPO_OCP_LABELS[g]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cantidad_personas">Cant. personas</Label>
          <Input
            id="cantidad_personas"
            type="number"
            step="0.01"
            min="0"
            value={form.cantidad_personas}
            onChange={(e) => setForm((f) => ({ ...f, cantidad_personas: e.target.value }))}
            required
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="concepto">Concepto</Label>
        <Input
          id="concepto"
          placeholder="Botas petroleras"
          value={form.concepto}
          onChange={(e) => setForm((f) => ({ ...f, concepto: e.target.value }))}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="costo_anual">Costo anual</Label>
        <Input
          id="costo_anual"
          type="number"
          step="0.01"
          min="0"
          value={form.costo_anual}
          onChange={(e) => setForm((f) => ({ ...f, costo_anual: e.target.value }))}
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
          {loading ? 'Guardando...' : isEdit ? 'Guardar' : 'Agregar'}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-end">
          <Dialog open={openNuevo} onOpenChange={setOpenNuevo}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Agregar ítem
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nuevo ítem OCP</DialogTitle>
              </DialogHeader>
              {FormBody(false)}
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={!!editando} onOpenChange={(v) => { if (!v) { setEditando(null); reset(); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar ítem OCP</DialogTitle>
            </DialogHeader>
            {FormBody(true)}
          </DialogContent>
        </Dialog>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No hay ítems OCP cargados.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Grupo</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead className="text-right">Costo anual</TableHead>
                <TableHead className="text-right">Personas</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell>{GRUPO_OCP_LABELS[it.grupo] ?? it.grupo}</TableCell>
                  <TableCell>{it.concepto}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrencyARS(it.costo_anual)}</TableCell>
                  <TableCell className="text-right font-mono">{it.cantidad_personas}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => abrirEdicion(it)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => eliminar(it.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      <div>
        <ResumenOCP resumen={resumen} />
      </div>
    </div>
  );
}
