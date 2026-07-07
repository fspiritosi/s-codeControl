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
import { formatCurrencyARS } from '@/shared/lib/utils/formatters';
import { formatPeriodoLabel } from '@/modules/costos/shared/utils/periodo';
import { ConfigOutputsServicio } from './ConfigOutputsServicio';
import { BotonGenerarComposicion } from './BotonGenerarComposicion';
import type { ComposicionListItem, TipoOutputServicioClient } from '@/modules/costos/shared/types/composicion.types';

interface Props {
  servicioId: string;
  servicioNombre: string;
  periodoDefault: string;
  composiciones: ComposicionListItem[];
  outputs: TipoOutputServicioClient[];
}

export function TabServicioComposicion({ servicioId, servicioNombre, periodoDefault, composiciones, outputs }: Props) {
  const router = useRouter();

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Composiciones del servicio</h3>
          <BotonGenerarComposicion
            servicios={[{ id: servicioId, nombre: servicioNombre }]}
            servicioId={servicioId}
            periodoDefault={periodoDefault}
            triggerLabel="Generar composición"
          />
        </div>
        {composiciones.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay composiciones para este servicio.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Precio mensual</TableHead>
                <TableHead className="text-center">PDF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {composiciones.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/dashboard/costos/composicion/${c.id}`)}
                >
                  <TableCell className="capitalize">{formatPeriodoLabel(c.periodo)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrencyARS(c.precio_mensual)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={c.tiene_pdf ? 'default' : 'secondary'}>{c.tiene_pdf ? 'Sí' : 'No'}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="border-t pt-6">
        <ConfigOutputsServicio servicioId={servicioId} outputs={outputs} />
      </div>
    </div>
  );
}
