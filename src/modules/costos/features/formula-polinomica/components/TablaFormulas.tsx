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
import { AlertTriangle } from 'lucide-react';
import type { FormulaListItem } from '@/modules/costos/shared/types/formula-polinomica.types';

export function TablaFormulas({ formulas }: { formulas: FormulaListItem[] }) {
  const router = useRouter();

  if (formulas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        No hay servicios. Creá un servicio y su composición para configurar la fórmula polinómica.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Servicio</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead className="text-center">Componentes</TableHead>
          <TableHead className="text-center">Períodos</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {formulas.map((f) => (
          <TableRow
            key={f.servicio_id}
            className="cursor-pointer"
            onClick={() => router.push(`/dashboard/costos/formula-polinomica/${f.servicio_id}`)}
          >
            <TableCell className="font-medium">{f.servicio_nombre}</TableCell>
            <TableCell>{f.customer_nombre}</TableCell>
            <TableCell className="text-center text-muted-foreground">{f.componentes_count}</TableCell>
            <TableCell className="text-center text-muted-foreground">{f.periodos_count}</TableCell>
            <TableCell>
              {!f.tiene_formula ? (
                <Badge variant="secondary">Sin configurar</Badge>
              ) : !f.ponderacion_valida ? (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" /> Ponderaciones ≠ 1
                </Badge>
              ) : (
                <Badge variant="default">Configurada</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
