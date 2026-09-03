'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/shared/components/ui/table';
import { FormConcepto, type IndiceOption, type ProductoOption } from './FormConcepto';
import { deleteConcepto, refrescarPreciosConceptos } from '../actions.server';
import type { ConceptoEquipoClient } from '@/modules/costos/shared/types/concepto.types';
import { formatDateUTC } from '@/shared/lib/utils/formatters';
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  conceptos: ConceptoEquipoClient[];
  productos: ProductoOption[];
  indices: IndiceOption[];
}

export function TablaConceptos({ conceptos, productos, indices }: Props) {
  const router = useRouter();
  const [openNuevo, setOpenNuevo] = useState(false);
  const [editando, setEditando] = useState<ConceptoEquipoClient | null>(null);
  const [refrescando, setRefrescando] = useState(false);

  const vinculados = conceptos.filter((c) => c.product_id).length;

  async function handleEliminar(c: ConceptoEquipoClient) {
    if (!confirm(`¿Eliminar el concepto «${c.nombre}»?`)) return;
    try {
      await deleteConcepto(c.id);
      toast.success('Concepto eliminado');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  async function handleRefrescar() {
    setRefrescando(true);
    try {
      const { actualizados } = await refrescarPreciosConceptos();
      toast.success(
        actualizados === 0
          ? 'Los precios ya estaban al día'
          : `${actualizados} ${actualizados === 1 ? 'concepto actualizado' : 'conceptos actualizados'}`
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al refrescar los precios');
    } finally {
      setRefrescando(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Conceptos ({conceptos.length})</CardTitle>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={vinculados === 0 || refrescando}
            title={
              vinculados === 0
                ? 'Ningún concepto está vinculado a un producto del almacén'
                : `Actualiza el precio de ${vinculados} concepto(s) desde el almacén`
            }
            onClick={handleRefrescar}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refrescando ? 'animate-spin' : ''}`} />
            {refrescando ? 'Refrescando...' : 'Refrescar precios'}
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setOpenNuevo(true)}>
            <Plus className="h-3.5 w-3.5" /> Nuevo concepto
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <FormConcepto
          open={openNuevo}
          onClose={() => setOpenNuevo(false)}
          conceptos={conceptos}
          productos={productos}
          indices={indices}
          onGuardado={() => router.refresh()}
        />
        <FormConcepto
          open={!!editando}
          onClose={() => setEditando(null)}
          concepto={editando ?? undefined}
          conceptos={conceptos}
          productos={productos}
          indices={indices}
          onGuardado={() => router.refresh()}
        />

        {conceptos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Todavía no hay conceptos en el catálogo. Creá el primero con «Nuevo concepto».
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Concepto</TableHead>
                <TableHead className="w-36">Clase</TableHead>
                <TableHead className="w-64">Cómo se calcula</TableHead>
                <TableHead className="w-32">Producto</TableHead>
                <TableHead className="w-32">Índice</TableHead>
                <TableHead className="w-32">Últ. refresco</TableHead>
                <TableHead className="text-right w-28">Tipos que lo usan</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {conceptos.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nombre}</TableCell>
                  <TableCell>
                    <Badge variant={c.clase === 'ACCESORIO' ? 'secondary' : 'outline'}>
                      {c.clase === 'ACCESORIO' ? 'Accesorio' : 'Mantenimiento'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.descripcion_calculo}
                  </TableCell>
                  <TableCell>
                    {c.product_code
                      ? <Badge variant="secondary">{c.product_code}</Badge>
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {c.indice_nombre ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.precio_actualizado_at ? formatDateUTC(c.precio_actualizado_at) : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono">{c.usado_en_tipos}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7"
                        onClick={() => setEditando(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                        onClick={() => handleEliminar(c)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
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
