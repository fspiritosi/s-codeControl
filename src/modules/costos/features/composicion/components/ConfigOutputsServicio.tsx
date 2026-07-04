'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
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
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { FormTipoOutput } from './FormTipoOutput';
import { addOutputServicio, updateOutputServicio, deleteOutputServicio } from '../actions.server';
import type { TipoOutputInput, TipoOutputServicioClient } from '@/modules/costos/shared/types/composicion.types';

const TIPO_LABEL: Record<string, string> = {
  precio_div_kms_x_factor: 'Precio ÷ km × factor',
  pct_sobre_precio: '% sobre precio',
  base_div_divisor: 'Base × factor ÷ divisor',
  precio_ponderado_div_divisor: 'Precio ponderado ÷ divisor',
};

interface Props {
  servicioId: string;
  outputs: TipoOutputServicioClient[];
}

export function ConfigOutputsServicio({ servicioId, outputs }: Props) {
  const router = useRouter();
  const [openNuevo, setOpenNuevo] = useState(false);
  const [editando, setEditando] = useState<TipoOutputServicioClient | null>(null);

  async function crear(input: TipoOutputInput) {
    try {
      await addOutputServicio(servicioId, input);
      toast.success('Output agregado.');
      setOpenNuevo(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al agregar');
    }
  }

  async function editar(input: TipoOutputInput) {
    if (!editando) return;
    try {
      await updateOutputServicio(editando.id, input);
      toast.success('Output actualizado.');
      setEditando(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar');
    }
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este output?')) return;
    try {
      await deleteOutputServicio(id);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Outputs derivados</h3>
          <p className="text-xs text-muted-foreground">
            Valores calculados a partir del precio (km excedente, día feriado, hora extra, etc.).
          </p>
        </div>
        <Dialog open={openNuevo} onOpenChange={setOpenNuevo}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Nuevo output
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nuevo output</DialogTitle>
            </DialogHeader>
            <FormTipoOutput onSubmit={crear} onCancel={() => setOpenNuevo(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {outputs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No hay outputs configurados.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {outputs.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-mono text-xs">{o.codigo}</TableCell>
                <TableCell>{o.nombre}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{TIPO_LABEL[o.formula.tipo] ?? o.formula.tipo}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditando(o)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => eliminar(o.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!editando} onOpenChange={(v) => !v && setEditando(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar output</DialogTitle>
          </DialogHeader>
          {editando && <FormTipoOutput output={editando} onSubmit={editar} onCancel={() => setEditando(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
