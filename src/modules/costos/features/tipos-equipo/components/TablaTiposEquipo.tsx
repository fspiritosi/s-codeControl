import Link from 'next/link';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/shared/components/ui/table';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import type { TipoCosteadoResumen } from '@/modules/costos/shared/types/concepto.types';
import { formatCurrencyARS } from '@/shared/lib/utils/formatters';

/**
 * Sólo los tipos que la empresa decidió costear. Las columnas de importe suman únicamente los
 * conceptos FIJO: los porcentuales y los por kilómetro dependen de cada unidad y se resuelven
 * en la pantalla del equipo, así que acá se cuentan en «Variables» pero no se suman.
 */
export function TablaTiposEquipo({ tipos }: { tipos: TipoCosteadoResumen[] }) {
  if (tipos.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-1">
          <p className="text-sm font-medium">Todavía no costeaste ningún tipo de equipo.</p>
          <p className="text-sm text-muted-foreground">
            Usá «Crear costo de equipo» para elegir un tipo y los conceptos que le aplican.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead rowSpan={2} className="align-bottom">Tipo de equipo</TableHead>
              <TableHead rowSpan={2} className="text-right w-24 align-bottom">Equipos</TableHead>
              <TableHead rowSpan={2} className="text-right w-28 align-bottom">Accesorios</TableHead>
              <TableHead rowSpan={2} className="text-right w-32 align-bottom">Ítems mant.</TableHead>
              <TableHead colSpan={2} className="text-center border-l">
                Totales de los conceptos fijos
              </TableHead>
              <TableHead rowSpan={2} className="text-right w-28 align-bottom">Variables</TableHead>
              <TableHead rowSpan={2} className="w-24" />
            </TableRow>
            <TableRow>
              <TableHead className="text-right w-44 border-l">Accesorios</TableHead>
              <TableHead className="text-right w-44">Mantenimiento anual</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tipos.map((t) => (
              <TableRow key={t.type_id}>
                <TableCell className="font-medium">{t.nombre}</TableCell>
                <TableCell className="text-right font-mono">{t.equipos_count}</TableCell>
                <TableCell className="text-right font-mono">{t.accesorios_count}</TableCell>
                <TableCell className="text-right font-mono">{t.mantenimiento_count}</TableCell>
                <TableCell className="text-right font-mono border-l">
                  {formatCurrencyARS(t.total_fijo_accesorios)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrencyARS(t.total_fijo_mantenimiento)}
                </TableCell>
                <TableCell className="text-right font-mono">{t.conceptos_variables}</TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/dashboard/costos/tipos-equipo/${t.type_id}`}>Ver</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-xs text-muted-foreground">
          Los conceptos porcentuales y por kilómetro se resuelven en cada equipo.
        </p>
      </CardContent>
    </Card>
  );
}
