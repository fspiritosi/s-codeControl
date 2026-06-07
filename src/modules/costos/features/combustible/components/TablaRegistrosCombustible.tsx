'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Button } from '@/shared/components/ui/button';
import { formatCurrencyARS } from '@/shared/lib/utils/formatters';
import { Pencil, Trash2 } from 'lucide-react';
import type { RegistroCombustibleClient } from '@/modules/costos/shared/types/combustible.types';

interface Props {
  registros: RegistroCombustibleClient[];
  onEdit: (r: RegistroCombustibleClient) => void;
  onDelete: (id: string) => void;
}

export function TablaRegistrosCombustible({ registros, onEdit, onDelete }: Props) {
  if (registros.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        No hay registros de combustible para este servicio.
      </p>
    );
  }

  const total = registros.reduce((acc, r) => acc + r.costo_total, 0);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-24">Período</TableHead>
          <TableHead>Vehículo</TableHead>
          <TableHead className="text-right">Lts gasoil</TableHead>
          <TableHead className="text-right">$ gasoil/lt</TableHead>
          <TableHead className="text-right">Lts urea</TableHead>
          <TableHead className="text-right">Costo total</TableHead>
          <TableHead className="w-20" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {registros.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-mono">{r.periodo}</TableCell>
            <TableCell>
              {r.vehiculo?.interno}
              {r.vehiculo?.dominio ? (
                <span className="text-xs text-muted-foreground ml-1">{r.vehiculo.dominio}</span>
              ) : null}
            </TableCell>
            <TableCell className="text-right font-mono">{r.litros_mensuales}</TableCell>
            <TableCell className="text-right font-mono">{formatCurrencyARS(r.precio_gasoil_lt)}</TableCell>
            <TableCell className="text-right font-mono">{r.litros_urea}</TableCell>
            <TableCell className="text-right font-mono font-medium">{formatCurrencyARS(r.costo_total)}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(r)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive"
                  onClick={() => onDelete(r.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        <TableRow className="border-t-2">
          <TableCell colSpan={5} className="font-medium">
            Total del servicio
          </TableCell>
          <TableCell className="text-right font-mono font-medium">{formatCurrencyARS(total)}</TableCell>
          <TableCell />
        </TableRow>
      </TableBody>
    </Table>
  );
}
