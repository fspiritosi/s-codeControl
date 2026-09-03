'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/shared/components/ui/table';
import { asociarConcepto, desasociarConcepto } from '../actions.server';
import type {
  ConceptoAsociadoClient,
  ConceptoEquipoClient,
} from '@/modules/costos/shared/types/concepto.types';
import type { ClaseItemCosto } from '@/modules/costos/shared/utils/calcular-costo-equipo';
import { formatCurrencyARS } from '@/shared/lib/utils/formatters';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  clase: ClaseItemCosto;
  perfilId: string;
  asociados: ConceptoAsociadoClient[];
  /** Catálogo completo de la empresa; el diálogo lo filtra por clase. */
  catalogo: ConceptoEquipoClient[];
  /**
   * Total de los conceptos FIJO de esta clase, calculado en el servidor en Decimal. No se
   * recalcula acá: los porcentuales no tienen importe hasta que se resuelven por equipo.
   */
  total_fijo: number;
}

const COPY = {
  ACCESORIO: {
    titulo: 'Accesorios',
    total: 'Total fijo de accesorios (a la base amortizable)',
    vacio: 'Este tipo no tiene accesorios asociados.',
  },
  MANTENIMIENTO: {
    titulo: 'Mantenimiento',
    total: 'Total fijo de mantenimiento anual',
    vacio: 'Este tipo no tiene ítems de mantenimiento asociados.',
  },
} as const;

export function ConceptosDelTipo({ clase, perfilId, asociados, catalogo, total_fijo }: Props) {
  const router = useRouter();
  const copy = COPY[clase];
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const yaAsociados = new Set(asociados.map((a) => a.id));
  const disponibles = catalogo.filter((c) => c.clase === clase && !yaAsociados.has(c.id));

  async function handleAsociar(conceptoId: string) {
    setLoading(true);
    try {
      await asociarConcepto(perfilId, conceptoId);
      toast.success('Concepto asociado');
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al asociar el concepto');
    } finally {
      setLoading(false);
    }
  }

  async function handleDesasociar(a: ConceptoAsociadoClient) {
    if (!confirm(`¿Sacar «${a.nombre}» de este tipo? El concepto sigue en el catálogo.`)) return;
    try {
      await desasociarConcepto(a.asociacion_id);
      toast.success('Concepto desasociado');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al desasociar');
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{copy.titulo} ({asociados.length})</CardTitle>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Asociar concepto
        </Button>
      </CardHeader>

      <CardContent>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Asociar {copy.titulo.toLowerCase()}</DialogTitle>
            </DialogHeader>
            {disponibles.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No quedan conceptos de esta clase para asociar. Creá uno nuevo en el catálogo de
                conceptos.
              </p>
            ) : (
              <div className="divide-y rounded border">
                {disponibles.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm truncate">{c.nombre}</p>
                      <p className="text-xs text-muted-foreground">{c.descripcion_calculo}</p>
                    </div>
                    <Button
                      size="sm" variant="outline" className="ml-auto shrink-0"
                      disabled={loading}
                      onClick={() => handleAsociar(c.id)}
                    >
                      Asociar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {asociados.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{copy.vacio}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Concepto</TableHead>
                <TableHead className="w-72">Cómo se calcula</TableHead>
                <TableHead className="w-32">Producto</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {asociados.map((a) => (
                <TableRow key={a.asociacion_id}>
                  <TableCell className="font-medium">{a.nombre}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {a.descripcion_calculo}
                  </TableCell>
                  <TableCell>
                    {a.product_code
                      ? <Badge variant="secondary">{a.product_code}</Badge>
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                      title="Sacar del tipo"
                      onClick={() => handleDesasociar(a)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2">
                <TableCell className="font-medium" colSpan={2}>{copy.total}</TableCell>
                <TableCell className="text-right font-mono font-medium" colSpan={2}>
                  {formatCurrencyARS(total_fijo)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
