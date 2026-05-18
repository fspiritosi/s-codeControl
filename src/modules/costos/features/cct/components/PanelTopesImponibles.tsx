'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
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
import { crearTope } from '../actions.server';
import type { TopeImponibleClient } from '../../../shared/types/cct.types';
import { formatCurrencyARS } from '@/shared/lib/utils/formatters';
import { Plus } from 'lucide-react';

interface Props {
  topes: TopeImponibleClient[];
}

export function PanelTopesImponibles({ topes }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ codigo: '', vigencia_desde: '', valor: '', fuente: '' });

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const valor = parseFloat(form.valor);
    if (isNaN(valor) || valor <= 0) { setError('El valor debe ser mayor a 0'); return; }
    setLoading(true);
    setError('');
    try {
      await crearTope({ ...form, valor });
      setOpen(false);
      setForm({ codigo: '', vigencia_desde: '', valor: '', fuente: '' });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al crear tope');
    } finally {
      setLoading(false);
    }
  }

  // Agrupar por código para mostrar historial
  const porCodigo = new Map<string, TopeImponibleClient[]>();
  for (const t of topes) {
    if (!porCodigo.has(t.codigo)) porCodigo.set(t.codigo, []);
    porCodigo.get(t.codigo)!.push(t);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Topes Imponibles</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Topes AFIP/ANSES vigentes por período. Solo administradores del sistema pueden modificar estos valores.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />Nuevo tope</Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Nuevo tope imponible</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Código</Label>
                <Input placeholder="jubilatorio_max" value={form.codigo} onChange={(e) => set('codigo', e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Vigencia desde</Label>
                  <Input placeholder="2026-01" value={form.vigencia_desde} onChange={(e) => set('vigencia_desde', e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Valor ($)</Label>
                  <Input type="number" step="0.01" placeholder="1234567.00" value={form.valor} onChange={(e) => set('valor', e.target.value)} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Fuente (opcional)</Label>
                <Input placeholder="Resol. ANSES 123/2026" value={form.fuente} onChange={(e) => set('fuente', e.target.value)} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Crear'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {topes.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-12">No hay topes cargados.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Vigencia</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Fuente</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topes.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-sm">{t.codigo}</TableCell>
                <TableCell>{t.vigencia_desde}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrencyARS(t.valor)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{t.fuente ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
