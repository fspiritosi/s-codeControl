'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import {
  deleteIndexValue,
  deleteIndice,
  listIndexValues,
  upsertIndexValue,
  upsertIndice,
} from '../actions.server';
import { MESES, type IndexValueData, type IndiceData } from '../types';

export function IndicesManager({ indices }: { indices: IndiceData[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<IndiceData | null>(null);
  const [values, setValues] = useState<IndexValueData[]>([]);
  const [loadingValues, setLoadingValues] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Dialogs de índice
  const [indiceDialogOpen, setIndiceDialogOpen] = useState(false);
  const [editingIndice, setEditingIndice] = useState<IndiceData | undefined>();
  const [indiceName, setIndiceName] = useState('');
  const [deletingIndiceId, setDeletingIndiceId] = useState<string | null>(null);

  // Dialogs de valor
  const [valueDialogOpen, setValueDialogOpen] = useState(false);
  const [editingValue, setEditingValue] = useState<IndexValueData | undefined>();
  const [valueForm, setValueForm] = useState({ mes: '1', anio: String(new Date().getFullYear()), variacion: '' });
  const [deletingValueId, setDeletingValueId] = useState<string | null>(null);

  // Cargar valores cuando cambia el índice seleccionado
  useEffect(() => {
    if (!selected) {
      setValues([]);
      return;
    }
    let active = true;
    setLoadingValues(true);
    listIndexValues(selected.id).then((rows) => {
      if (!active) return;
      setValues(rows);
      setLoadingValues(false);
    });
    return () => {
      active = false;
    };
  }, [selected]);

  const refreshValues = () => {
    if (!selected) return;
    listIndexValues(selected.id).then(setValues);
  };

  // ── Índice ──
  const openCreateIndice = () => {
    setEditingIndice(undefined);
    setIndiceName('');
    setIndiceDialogOpen(true);
  };
  const openEditIndice = (i: IndiceData) => {
    setEditingIndice(i);
    setIndiceName(i.nombre);
    setIndiceDialogOpen(true);
  };
  const submitIndice = () => {
    if (!indiceName.trim()) {
      toast.error('Ingresá el nombre del índice');
      return;
    }
    startTransition(async () => {
      const r = await upsertIndice({ id: editingIndice?.id, nombre: indiceName });
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success(editingIndice ? 'Índice actualizado' : 'Índice creado');
      setIndiceDialogOpen(false);
      router.refresh();
    });
  };
  const confirmDeleteIndice = () => {
    if (!deletingIndiceId) return;
    const id = deletingIndiceId;
    setDeletingIndiceId(null);
    startTransition(async () => {
      const r = await deleteIndice(id);
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success('Índice eliminado');
      if (selected?.id === id) setSelected(null);
      router.refresh();
    });
  };

  // ── Valor ──
  const openCreateValue = () => {
    setEditingValue(undefined);
    setValueForm({ mes: '1', anio: String(new Date().getFullYear()), variacion: '' });
    setValueDialogOpen(true);
  };
  const openEditValue = (v: IndexValueData) => {
    setEditingValue(v);
    setValueForm({ mes: String(v.mes), anio: String(v.anio), variacion: String(v.variacion) });
    setValueDialogOpen(true);
  };
  const submitValue = () => {
    if (!selected) return;
    const variacion = parseFloat(valueForm.variacion);
    if (Number.isNaN(variacion)) {
      toast.error('Ingresá una variación válida');
      return;
    }
    const anio = parseInt(valueForm.anio, 10);
    if (Number.isNaN(anio)) {
      toast.error('Ingresá un año válido');
      return;
    }
    startTransition(async () => {
      const r = await upsertIndexValue({
        id: editingValue?.id,
        indice_id: selected.id,
        mes: parseInt(valueForm.mes, 10),
        anio,
        variacion,
      });
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success(editingValue ? 'Valor actualizado' : 'Valor agregado');
      setValueDialogOpen(false);
      refreshValues();
      router.refresh();
    });
  };
  const confirmDeleteValue = () => {
    if (!deletingValueId) return;
    const id = deletingValueId;
    setDeletingValueId(null);
    startTransition(async () => {
      const r = await deleteIndexValue(id);
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success('Valor eliminado');
      refreshValues();
      router.refresh();
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Catálogo de índices */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Índices</h3>
          <Button size="sm" onClick={openCreateIndice}>
            <Plus className="size-4 mr-1" /> Nuevo índice
          </Button>
        </div>
        <div className="rounded-md border mt-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-center">Valores</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {indices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-8">
                    No hay índices creados.
                  </TableCell>
                </TableRow>
              ) : (
                indices.map((i) => (
                  <TableRow
                    key={i.id}
                    className={`cursor-pointer ${selected?.id === i.id ? 'bg-muted' : ''}`}
                    onClick={() => setSelected(i)}
                  >
                    <TableCell className="font-medium">{i.nombre}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{i.valuesCount}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="ghost" onClick={() => openEditIndice(i)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeletingIndiceId(i.id)}
                          disabled={isPending}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Valores del índice seleccionado */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            {selected ? `Valores — ${selected.nombre}` : 'Valores'}
          </h3>
          {selected && (
            <Button size="sm" onClick={openCreateValue}>
              <Plus className="size-4 mr-1" /> Nuevo valor
            </Button>
          )}
        </div>
        <div className="rounded-md border mt-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Variación (%)</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!selected ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-8">
                    Seleccioná un índice para ver sus valores.
                  </TableCell>
                </TableRow>
              ) : loadingValues ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-8">
                    Cargando…
                  </TableCell>
                </TableRow>
              ) : values.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-8">
                    Sin valores cargados.
                  </TableCell>
                </TableRow>
              ) : (
                values.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      {MESES[v.mes - 1]} {v.anio}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {v.variacion.toLocaleString('es-AR', { minimumFractionDigits: 2 })}%
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEditValue(v)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeletingValueId(v.id)}
                          disabled={isPending}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialog índice */}
      <Dialog open={indiceDialogOpen} onOpenChange={setIndiceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingIndice ? 'Editar índice' : 'Nuevo índice'}</DialogTitle>
            <DialogDescription>
              El nombre identifica al índice (por ej. &quot;ICL&quot;, &quot;IPC&quot;, &quot;UVA&quot;).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="idx-name">Nombre</Label>
            <Input
              id="idx-name"
              value={indiceName}
              onChange={(e) => setIndiceName(e.target.value)}
              placeholder="Índice de la construcción"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIndiceDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submitIndice} disabled={isPending}>
              {editingIndice ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog valor */}
      <Dialog open={valueDialogOpen} onOpenChange={setValueDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingValue ? 'Editar valor' : 'Nuevo valor'}</DialogTitle>
            <DialogDescription>Variación porcentual del período.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="iv-mes">Mes</Label>
              <Select
                value={valueForm.mes}
                onValueChange={(v) => setValueForm((f) => ({ ...f, mes: v }))}
              >
                <SelectTrigger id="iv-mes">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((m, idx) => (
                    <SelectItem key={m} value={String(idx + 1)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="iv-anio">Año</Label>
              <Input
                id="iv-anio"
                type="number"
                min="1900"
                max="2999"
                value={valueForm.anio}
                onChange={(e) => setValueForm((f) => ({ ...f, anio: e.target.value }))}
              />
            </div>
            <div className="col-span-2 grid gap-1.5">
              <Label htmlFor="iv-var">Variación (%)</Label>
              <Input
                id="iv-var"
                type="number"
                step="0.0001"
                placeholder="4.5"
                value={valueForm.variacion}
                onChange={(e) => setValueForm((f) => ({ ...f, variacion: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setValueDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submitValue} disabled={isPending}>
              {editingValue ? 'Guardar' : 'Agregar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmaciones de borrado */}
      <AlertDialog open={!!deletingIndiceId} onOpenChange={(v) => !v && setDeletingIndiceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar índice</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el índice y todos sus valores cargados. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteIndice}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingValueId} onOpenChange={(v) => !v && setDeletingValueId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar valor</AlertDialogTitle>
            <AlertDialogDescription>Se eliminará este valor del índice.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteValue}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
