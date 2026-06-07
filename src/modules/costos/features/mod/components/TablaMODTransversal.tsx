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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Label } from '@/shared/components/ui/label';

interface Row {
  id: string;
  servicio_id: string;
  servicio_nombre: string;
  employee_nombre: string;
  categoria_codigo: string;
  antiguedad_anios: number;
  afectacion_pct: number;
  is_active: boolean;
}

export function TablaMODTransversal({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [servicio, setServicio] = useState('todos');

  const servicios = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => map.set(r.servicio_id, r.servicio_nombre));
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [rows]);

  const filtradas = servicio === 'todos' ? rows : rows.filter((r) => r.servicio_id === servicio);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5 max-w-xs">
        <Label>Servicio</Label>
        <Select value={servicio} onValueChange={setServicio}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los servicios</SelectItem>
            {servicios.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtradas.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">No hay asignaciones de mano de obra.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Servicio</TableHead>
              <TableHead>Empleado</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Antig.</TableHead>
              <TableHead className="text-right">Afectación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.map((r) => (
              <TableRow
                key={r.id}
                className="cursor-pointer"
                onClick={() => router.push(`/dashboard/costos/servicios/${r.servicio_id}`)}
              >
                <TableCell className="text-sm">{r.servicio_nombre}</TableCell>
                <TableCell>{r.employee_nombre}</TableCell>
                <TableCell className="font-mono">{r.categoria_codigo}</TableCell>
                <TableCell className="text-right">{r.antiguedad_anios}</TableCell>
                <TableCell className="text-right">{Math.round(r.afectacion_pct * 100)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
