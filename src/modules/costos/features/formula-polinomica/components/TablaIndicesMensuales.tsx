'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrencyARS } from '@/shared/lib/utils/formatters';
import { formatPeriodoLabel } from '@/modules/costos/shared/utils/periodo';
import { FormPeriodoIndices } from './FormPeriodoIndices';
import { upsertPeriodo, deletePeriodo } from '../actions.server';
import type { ComponenteFormulaClient, PeriodoConValores } from '@/modules/costos/shared/types/formula-polinomica.types';

interface Props {
  formulaId: string;
  componentes: ComponenteFormulaClient[];
  periodos: PeriodoConValores[];
  disabled?: boolean;
}

export function TablaIndicesMensuales({ formulaId, componentes, periodos, disabled }: Props) {
  const router = useRouter();
  const [openNuevo, setOpenNuevo] = useState(false);
  const [editando, setEditando] = useState<PeriodoConValores | null>(null);

  async function guardar(periodo: string, valores: Record<string, number>, certificado?: number) {
    try {
      await upsertPeriodo(formulaId, periodo, valores, certificado);
      toast.success('Período calculado y guardado.');
      setOpenNuevo(false);
      setEditando(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este período?')) return;
    try {
      await deletePeriodo(id);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Períodos e índices</CardTitle>
        <Dialog open={openNuevo} onOpenChange={setOpenNuevo}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5" disabled={disabled}>
              <Plus className="h-3.5 w-3.5" /> Período
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Cargar período</DialogTitle>
            </DialogHeader>
            <FormPeriodoIndices componentes={componentes} onSubmit={guardar} onCancel={() => setOpenNuevo(false)} />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {disabled && (
          <p className="text-xs text-destructive mb-2">Ajustá las ponderaciones (suma 100%) antes de cargar períodos.</p>
        )}
        {periodos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Sin períodos cargados.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Ajuste %</TableHead>
                  <TableHead className="text-right">Valor ajustado</TableHead>
                  <TableHead className="text-right">Certificado</TableHead>
                  <TableHead className="text-right">Retroactivo acum.</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {periodos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="capitalize">{formatPeriodoLabel(p.periodo)}</TableCell>
                    <TableCell className="text-right font-mono">{(p.ajuste_porcentual_acumulado * 100).toFixed(3)}%</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrencyARS(p.valor_ajustado)}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {p.importe_certificado != null ? formatCurrencyARS(p.importe_certificado) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {p.retroactivo_acumulado != null ? formatCurrencyARS(p.retroactivo_acumulado) : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditando(p)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => eliminar(p.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={!!editando} onOpenChange={(v) => !v && setEditando(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar período</DialogTitle>
          </DialogHeader>
          {editando && (
            <FormPeriodoIndices
              componentes={componentes}
              periodoExistente={editando}
              onSubmit={guardar}
              onCancel={() => setEditando(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
