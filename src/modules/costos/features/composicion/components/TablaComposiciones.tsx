'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { formatCurrencyARS } from '@/shared/lib/utils/formatters';
import { formatPeriodoLabel } from '@/modules/costos/shared/utils/periodo';
import type { ComposicionListItem } from '@/modules/costos/shared/types/composicion.types';

interface Props {
  composiciones: ComposicionListItem[];
}

const TODOS = '__todos__';

export function TablaComposiciones({ composiciones }: Props) {
  const router = useRouter();
  const [servicioFiltro, setServicioFiltro] = useState<string>(TODOS);
  const [periodoFiltro, setPeriodoFiltro] = useState('');

  const servicios = useMemo(() => {
    const map = new Map<string, string>();
    composiciones.forEach((c) => map.set(c.servicio_id, c.servicio_nombre));
    return Array.from(map, ([id, nombre]) => ({ id, nombre }));
  }, [composiciones]);

  const filtradas = composiciones.filter((c) => {
    if (servicioFiltro !== TODOS && c.servicio_id !== servicioFiltro) return false;
    if (periodoFiltro && !c.periodo.startsWith(periodoFiltro)) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Select value={servicioFiltro} onValueChange={setServicioFiltro}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Todos los servicios" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos los servicios</SelectItem>
            {servicios.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="month"
          value={periodoFiltro}
          onChange={(e) => setPeriodoFiltro(e.target.value)}
          className="w-48"
          placeholder="Período"
        />
      </div>

      {filtradas.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          No hay composiciones. Generá la primera con “Nueva composición”.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Servicio</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Período</TableHead>
              <TableHead className="text-right">Precio mensual</TableHead>
              <TableHead className="text-center">PDF</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.map((c) => (
              <TableRow
                key={c.id}
                className="cursor-pointer"
                onClick={() => router.push(`/dashboard/costos/composicion/${c.id}`)}
              >
                <TableCell className="font-medium">{c.servicio_nombre}</TableCell>
                <TableCell>{c.customer_nombre}</TableCell>
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
  );
}
