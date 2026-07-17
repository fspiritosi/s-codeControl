'use client';

import { format, formatRelative } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Button } from '@/shared/components/ui/button';
import type { DocumentLogEntry } from '@/modules/documents/features/list/actions.server';

function formatValidity(validity: string | null): string | null {
  if (!validity) return null;
  const d = new Date(validity);
  if (Number.isNaN(d.getTime())) return validity;
  return format(d, "d 'de' MMMM 'de' yyyy", { locale: es });
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: DocumentLogEntry[];
}

/**
 * Diálogo compartido de "Historial de Modificaciones" (tsk-438).
 * Muestra quién hizo cada cambio (modified_by real), cuándo, y el vencimiento
 * vigente del documento. Reemplaza el bloque duplicado que existía inline en
 * cada archivo de columnas de documentos.
 */
export function DocumentHistoryDialog({ open, onOpenChange, entries }: Props) {
  const validity = formatValidity(entries.find((e) => e.validity)?.validity ?? null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Historial de Modificaciones</DialogTitle>
        <DialogDescription>
          Quién modificó el documento y cuándo.
          {validity && (
            <>
              {' '}
              Vencimiento vigente: <span className="font-medium text-foreground">{validity}</span>.
            </>
          )}
        </DialogDescription>
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell className="text-center">Usuario</TableCell>
              <TableCell className="text-center">Fecha de modificación</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground">
                  Sin modificaciones registradas.
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-center">
                    {entry.modifierName || entry.modifierEmail || 'Usuario desconocido'}
                  </TableCell>
                  <TableCell className="text-center">
                    {formatRelative(new Date(entry.updatedAt), new Date(), { locale: es })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
