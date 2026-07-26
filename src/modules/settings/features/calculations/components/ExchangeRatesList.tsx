'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
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
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { ExchangeRateEditorDialog } from './ExchangeRateEditorDialog';
import { deleteExchangeRate } from '../actions.server';
import type { ExchangeRateData } from '../types';

const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

export function ExchangeRatesList({ rates }: { rates: ExchangeRateData[] }) {
  const router = useRouter();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ExchangeRateData | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const openCreate = () => {
    setEditing(undefined);
    setEditorOpen(true);
  };
  const openEdit = (r: ExchangeRateData) => {
    setEditing(r);
    setEditorOpen(true);
  };

  const handleDelete = () => {
    if (!deletingId) return;
    const id = deletingId;
    setDeletingId(null);
    startTransition(async () => {
      const r = await deleteExchangeRate(id);
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success('Cotización eliminada');
      router.refresh();
    });
  };

  return (
    <>
      <div className="flex justify-end">
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4 mr-1" /> Nueva cotización
        </Button>
      </div>

      <div className="rounded-md border mt-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Par</TableHead>
              <TableHead className="text-right">Valor (ARS/USD)</TableHead>
              <TableHead>Fuente</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                  No hay cotizaciones cargadas.
                </TableCell>
              </TableRow>
            ) : (
              rates.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{fmtDate(r.fecha)}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {r.moneda_origen} → {r.moneda_destino}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {r.valor.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.fuente ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeletingId(r.id)}
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

      <ExchangeRateEditorDialog open={editorOpen} onOpenChange={setEditorOpen} rate={editing} />

      <AlertDialog open={!!deletingId} onOpenChange={(v) => !v && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar cotización</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará esta cotización del historial. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
