'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ListOrdered } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';

import { deleteSalesPointOfSale } from '../actions.server';
import { PointOfSaleFormDialog } from './PointOfSaleFormDialog';
import { SequenceConfigDialog } from './SequenceConfigDialog';

export interface SalesPointOfSaleRow {
  id: string;
  number: number;
  name: string;
  is_active: boolean;
  invoices_count: number;
  sequences: { voucher_type: string; next_number: number }[];
}

interface PointsOfSaleListProps {
  data: SalesPointOfSaleRow[];
}

export function PointsOfSaleList({ data }: PointsOfSaleListProps) {
  const router = useRouter();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SalesPointOfSaleRow | null>(null);

  const [seqOpen, setSeqOpen] = useState(false);
  const [seqItem, setSeqItem] = useState<SalesPointOfSaleRow | null>(null);

  const [deleting, setDeleting] = useState<SalesPointOfSaleRow | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (row: SalesPointOfSaleRow) => {
    setEditing(row);
    setFormOpen(true);
  };

  const openSequences = (row: SalesPointOfSaleRow) => {
    setSeqItem(row);
    setSeqOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeletePending(true);
    try {
      const result = await deleteSalesPointOfSale(deleting.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Punto de venta eliminado');
      setDeleting(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar el punto de venta');
    } finally {
      setDeletePending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo punto de venta
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Número</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="w-[120px]">Estado</TableHead>
              <TableHead className="w-[140px] text-right">Comprobantes</TableHead>
              <TableHead className="w-[160px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No hay puntos de venta cargados.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono">{String(row.number).padStart(4, '0')}</TableCell>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>
                    {row.is_active ? (
                      <Badge variant="default">Activo</Badge>
                    ) : (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{row.invoices_count}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Configurar numeración"
                        onClick={() => openSequences(row)}
                      >
                        <ListOrdered className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Editar"
                        onClick={() => openEdit(row)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Eliminar"
                        onClick={() => setDeleting(row)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PointOfSaleFormDialog open={formOpen} onOpenChange={setFormOpen} item={editing} />
      <SequenceConfigDialog open={seqOpen} onOpenChange={setSeqOpen} item={seqItem} />

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar punto de venta?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting
                ? `Se eliminará el punto de venta ${String(deleting.number).padStart(4, '0')} — ${deleting.name}. Esta acción no se puede deshacer.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deletePending}
            >
              {deletePending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
