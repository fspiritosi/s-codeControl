'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { TaxTypeEditorDialog } from './TaxTypeEditorDialog';
import { deleteTaxType, toggleTaxTypeActive } from '../actions.server';
import {
  TAX_CALCULATION_BASE_LABELS,
  TAX_SCOPE_LABELS,
  type TaxTypeData,
} from '../types';

interface Props {
  taxTypes: TaxTypeData[];
  kind: 'RETENTION' | 'PERCEPTION';
}

export function TaxTypesList({ taxTypes, kind }: Props) {
  const router = useRouter();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<TaxTypeData | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = taxTypes.filter((t) => t.kind === kind);

  const openCreate = () => {
    setEditing(undefined);
    setEditorOpen(true);
  };

  const openEdit = (t: TaxTypeData) => {
    setEditing(t);
    setEditorOpen(true);
  };

  const handleToggle = (id: string) => {
    startTransition(async () => {
      const r = await toggleTaxTypeActive(id);
      if (r.error) toast.error(r.error);
      else router.refresh();
    });
  };

  const handleDelete = () => {
    if (!deletingId) return;
    const id = deletingId;
    setDeletingId(null);
    startTransition(async () => {
      const r = await deleteTaxType(id);
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success('Tipo eliminado');
      router.refresh();
    });
  };

  return (
    <>
      <div className="flex justify-end">
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4 mr-1" /> Nuevo {kind === 'RETENTION' ? 'retención' : 'percepción'}
        </Button>
      </div>

      <div className="rounded-md border mt-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Alcance</TableHead>
              <TableHead>Base</TableHead>
              <TableHead className="text-right">Alícuota</TableHead>
              <TableHead className="text-right">Mín.</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                  No hay tipos configurados.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.code}</TableCell>
                  <TableCell className="font-medium">
                    <div>{t.name}</div>
                    {t.notes && (
                      <div className="text-xs text-muted-foreground">{t.notes}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {TAX_SCOPE_LABELS[t.scope]}
                    {t.jurisdiction && (
                      <span className="text-muted-foreground"> — {t.jurisdiction}</span>
                    )}
                  </TableCell>
                  <TableCell>{TAX_CALCULATION_BASE_LABELS[t.calculation_base]}</TableCell>
                  <TableCell className="text-right">{t.default_rate}%</TableCell>
                  <TableCell className="text-right">
                    {t.min_taxable_amount !== null
                      ? `$${t.min_taxable_amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                      : '—'}
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      type="button"
                      onClick={() => handleToggle(t.id)}
                      disabled={isPending}
                      className="inline-flex"
                      aria-label={t.is_active ? 'Desactivar' : 'Activar'}
                    >
                      {t.is_active ? (
                        <Badge variant="default">Activo</Badge>
                      ) : (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(t)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeletingId(t.id)}
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

      <TaxTypeEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        taxType={editing}
        defaultKind={kind}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(v) => !v && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar tipo</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar este tipo de impuesto. Si ya fue usado en facturas u órdenes
              de pago, la operación va a fallar y deberías desactivarlo en su lugar.
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
