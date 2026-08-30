import Link from 'next/link';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/shared/components/ui/table';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import type { TipoEquipoResumen } from '@/modules/costos/shared/types/tipo-equipo.types';
import { formatCurrencyARS } from '@/shared/lib/utils/formatters';

export function TablaTiposEquipo({ tipos }: { tipos: TipoEquipoResumen[] }) {
  if (tipos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No hay tipos de equipo cargados en la empresa.
      </p>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo de equipo</TableHead>
              <TableHead className="text-right w-24">Equipos</TableHead>
              <TableHead className="text-right w-28">Accesorios</TableHead>
              <TableHead className="text-right w-32">Ítems mant.</TableHead>
              <TableHead className="text-right w-44">Total accesorios</TableHead>
              <TableHead className="text-right w-44">Mantenimiento anual</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tipos.map((t) => (
              <TableRow key={t.type_id}>
                <TableCell className="font-medium">{t.nombre}</TableCell>
                <TableCell className="text-right font-mono">{t.equipos_count}</TableCell>
                <TableCell className="text-right font-mono">{t.accesorios_count}</TableCell>
                <TableCell className="text-right font-mono">{t.mantenimiento_count}</TableCell>
                <TableCell className="text-right font-mono">{formatCurrencyARS(t.total_accesorios)}</TableCell>
                <TableCell className="text-right font-mono">{formatCurrencyARS(t.mantenimiento_anual)}</TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/dashboard/costos/tipos-equipo/${t.type_id}`}>Editar</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
