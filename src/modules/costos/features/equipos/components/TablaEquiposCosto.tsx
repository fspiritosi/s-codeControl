'use client';

import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { formatCurrencyARS } from '@/shared/lib/utils/formatters';
import { ChevronRight } from 'lucide-react';
import type { VehiculoConCosto } from '@/modules/costos/shared/types/equipo.types';

interface Props {
  vehiculos: VehiculoConCosto[];
}

/** Tabla principal de equipos con su costo mensual calculado. Click → detalle. */
export function TablaEquiposCosto({ vehiculos }: Props) {
  const router = useRouter();

  if (vehiculos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        No hay vehículos cargados para esta empresa.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-20">Interno</TableHead>
          <TableHead>Vehículo</TableHead>
          <TableHead>Dominio</TableHead>
          <TableHead className="text-right">Valor compra</TableHead>
          <TableHead className="text-right">Costo mensual</TableHead>
          <TableHead className="text-center w-20">Ítems</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {vehiculos.map((v) => (
          <TableRow
            key={v.id}
            className="cursor-pointer"
            onClick={() => router.push(`/dashboard/costos/equipos/${v.id}`)}
          >
            <TableCell className="font-mono font-medium">{v.interno}</TableCell>
            <TableCell>
              <span className="text-sm">{v.marca} {v.modelo}</span>
              <span className="text-xs text-muted-foreground ml-1">({v.anio})</span>
            </TableCell>
            <TableCell className="font-mono text-xs">{v.dominio ?? '—'}</TableCell>
            <TableCell className="text-right">
              {v.valor_compra != null ? formatCurrencyARS(v.valor_compra) : '—'}
            </TableCell>
            <TableCell className="text-right font-medium">
              {v.costo_mensual != null ? (
                formatCurrencyARS(v.costo_mensual)
              ) : (
                <Badge variant="secondary">Sin costo</Badge>
              )}
            </TableCell>
            <TableCell className="text-center text-muted-foreground">{v.items_count}</TableCell>
            <TableCell>
              <Button size="icon" variant="ghost" className="h-7 w-7">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
