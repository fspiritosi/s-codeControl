import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/shared/components/ui/table';
import type { ConceptoResueltoClient } from '@/modules/costos/shared/types/equipo.types';
import { formatCurrencyARS } from '@/shared/lib/utils/formatters';
import { ExternalLink } from 'lucide-react';

interface Props {
  tipo: { id: string; nombre: string };
  accesorios_total: number;
  mantenimiento_mensual: number;
  /** Conceptos del tipo con el importe que le toca a ESTA unidad, resuelto en el servidor. */
  conceptos_resueltos: ConceptoResueltoClient[];
}

/**
 * Los conceptos se definen a nivel tipo, pero el importe es de esta unidad: un concepto
 * porcentual vale distinto en dos equipos del mismo tipo con distinto valor de compra.
 */
export function ItemsHeredadosDelTipo({
  tipo,
  accesorios_total,
  mantenimiento_mensual,
  conceptos_resueltos,
}: Props) {
  const cuantos = conceptos_resueltos.length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">
            Accesorios y mantenimiento del tipo «{tipo.nombre}»
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {cuantos === 0
              ? 'Este tipo todavía no tiene conceptos asociados.'
              : `${cuantos} ${cuantos === 1 ? 'concepto' : 'conceptos'} del tipo, con el importe que le corresponde a esta unidad.`}
          </p>
        </div>
        <Button asChild size="sm" variant="outline" className="gap-1.5">
          <Link href={`/dashboard/costos/tipos-equipo/${tipo.id}`}>
            <ExternalLink className="h-3.5 w-3.5" /> Editar en tipos de equipo
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Accesorios (a la base amortizable)</p>
            <p className="text-lg font-mono">{formatCurrencyARS(accesorios_total)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Mantenimiento mensual</p>
            <p className="text-lg font-mono">{formatCurrencyARS(mantenimiento_mensual)}</p>
          </div>
        </div>

        {cuantos > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Concepto</TableHead>
                <TableHead className="w-36">Clase</TableHead>
                <TableHead className="w-64">Cómo se calcula</TableHead>
                <TableHead className="text-right w-44">Importe de esta unidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conceptos_resueltos.map((c) => (
                <TableRow key={c.codigo}>
                  <TableCell className="font-medium">{c.nombre}</TableCell>
                  <TableCell>
                    <Badge variant={c.clase === 'ACCESORIO' ? 'secondary' : 'outline'}>
                      {c.clase === 'ACCESORIO' ? 'Accesorio' : 'Mantenimiento'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.descripcion_calculo}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrencyARS(c.importe)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
