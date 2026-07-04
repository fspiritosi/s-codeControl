'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
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
import { FormComponente } from './FormComponente';
import { addComponente, updateComponente, deleteComponente } from '../actions.server';
import { TIPO_INDICE_LABELS, type ComponenteFormulaClient, type ComponenteInput } from '@/modules/costos/shared/types/formula-polinomica.types';

interface Props {
  formulaId: string;
  componentes: ComponenteFormulaClient[];
}

export function TablaComponentes({ formulaId, componentes }: Props) {
  const router = useRouter();
  const [openNuevo, setOpenNuevo] = useState(false);
  const [editando, setEditando] = useState<ComponenteFormulaClient | null>(null);

  const suma = componentes.reduce((acc, c) => acc + c.ponderacion, 0);
  const sumaValida = Math.abs(suma - 1) < 0.0001;

  async function crear(input: ComponenteInput) {
    try {
      await addComponente(formulaId, input);
      toast.success('Componente agregado.');
      setOpenNuevo(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  }

  async function editar(input: ComponenteInput) {
    if (!editando) return;
    try {
      await updateComponente(editando.id, input);
      toast.success('Componente actualizado.');
      setEditando(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este componente?')) return;
    try {
      await deleteComponente(id);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Componentes</CardTitle>
        <Dialog open={openNuevo} onOpenChange={setOpenNuevo}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Componente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nuevo componente</DialogTitle>
            </DialogHeader>
            <FormComponente onSubmit={crear} onCancel={() => setOpenNuevo(false)} />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {componentes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Sin componentes. Agregá los índices o inicializá desde la composición.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Índice</TableHead>
                <TableHead className="text-right">Ponderación</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {componentes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.codigo}</TableCell>
                  <TableCell>{c.nombre}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{TIPO_INDICE_LABELS[c.tipo_indice]}</TableCell>
                  <TableCell className="text-right font-mono">{(c.ponderacion * 100).toFixed(2)}%</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditando(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => eliminar(c.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2">
                <TableCell colSpan={3} className="font-medium">
                  Suma de ponderaciones
                </TableCell>
                <TableCell className={`text-right font-mono font-bold ${sumaValida ? 'text-primary' : 'text-destructive'}`}>
                  {(suma * 100).toFixed(2)}%
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        )}
        {!sumaValida && componentes.length > 0 && (
          <p className="text-xs text-destructive mt-2">La suma de ponderaciones debe ser 100% para calcular períodos.</p>
        )}
      </CardContent>

      <Dialog open={!!editando} onOpenChange={(v) => !v && setEditando(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar componente</DialogTitle>
          </DialogHeader>
          {editando && <FormComponente componente={editando} onSubmit={editar} onCancel={() => setEditando(null)} />}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
