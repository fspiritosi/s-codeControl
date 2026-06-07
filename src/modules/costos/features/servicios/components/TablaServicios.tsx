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
import type { ServicioListItem } from '@/modules/costos/shared/types/servicio.types';

interface Props {
  servicios: ServicioListItem[];
}

export function TablaServicios({ servicios }: Props) {
  const router = useRouter();

  if (servicios.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        No hay servicios. Creá el primero con “Nuevo servicio”.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>CCT</TableHead>
          <TableHead>Inicio</TableHead>
          <TableHead className="text-center">MOD</TableHead>
          <TableHead className="text-center">OCP</TableHead>
          <TableHead className="text-center">Equipos</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {servicios.map((s) => (
          <TableRow
            key={s.id}
            className="cursor-pointer"
            onClick={() => router.push(`/dashboard/costos/servicios/${s.id}`)}
          >
            <TableCell className="font-medium">{s.nombre}</TableCell>
            <TableCell>{s.customer_nombre}</TableCell>
            <TableCell className="font-mono text-xs">{s.cct_codigo}</TableCell>
            <TableCell className="text-sm">{s.fecha_inicio}</TableCell>
            <TableCell className="text-center text-muted-foreground">{s.asignaciones_mod_count}</TableCell>
            <TableCell className="text-center text-muted-foreground">{s.items_ocp_count}</TableCell>
            <TableCell className="text-center text-muted-foreground">{s.equipos_count}</TableCell>
            <TableCell>
              <Badge variant={s.is_active ? 'default' : 'secondary'}>
                {s.is_active ? 'Activo' : 'Inactivo'}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
