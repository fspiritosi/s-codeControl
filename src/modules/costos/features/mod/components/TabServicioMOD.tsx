'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { ResumenMOD } from './ResumenMOD';
import { FormAsignacionMOD, type MODFormData } from './FormAsignacionMOD';
import { deleteAsignacionMOD } from '../actions.server';
import type { AsignacionMODConDetalle, ResumenMOD as ResumenMODType } from '@/modules/costos/shared/types/mod.types';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  servicioId: string;
  asignaciones: AsignacionMODConDetalle[];
  resumen: ResumenMODType;
  formData: MODFormData;
}

export function TabServicioMOD({ servicioId, asignaciones, resumen, formData }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState<AsignacionMODConDetalle | null>(null);

  async function eliminar(id: string) {
    if (!confirm('¿Quitar esta asignación?')) return;
    try {
      await deleteAsignacionMOD(id);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => {
              setEditando(null);
              setOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" /> Asignar chofer
          </Button>
        </div>

        {asignaciones.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay choferes asignados a este servicio.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Antig.</TableHead>
                <TableHead className="text-right">Afectación</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {asignaciones.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.employee_nombre}</TableCell>
                  <TableCell>
                    <span className="font-mono">{a.categoria_codigo}</span>
                    <span className="text-xs text-muted-foreground ml-1">{a.categoria_nombre}</span>
                  </TableCell>
                  <TableCell className="text-right">{a.antiguedad_anios}</TableCell>
                  <TableCell className="text-right">{Math.round(a.afectacion_pct * 100)}%</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => {
                          setEditando(a);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => eliminar(a.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      <div>
        <ResumenMOD resumen={resumen} />
      </div>

      <FormAsignacionMOD
        key={editando?.id ?? 'nuevo'}
        open={open}
        onOpenChange={setOpen}
        servicioId={servicioId}
        data={formData}
        asignacion={editando}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
