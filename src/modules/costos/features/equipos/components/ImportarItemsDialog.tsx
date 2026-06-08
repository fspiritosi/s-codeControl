'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { bulkAddItemsMantenimiento } from '../actions.server';
import type { ItemMantInput } from '@/modules/costos/shared/types/equipo.types';
import { formatCurrencyARS } from '@/shared/lib/utils/formatters';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  costoEquipoId: string;
}

type ParseResult = { items: ItemMantInput[]; errores: string[] };

/** Normaliza un número que puede venir con $, miles con punto y decimales con coma. */
function parseNumero(raw: string): number | null {
  let s = raw.trim().replace(/\$/g, '').replace(/\s/g, '');
  if (!s) return null;
  // Si tiene coma y punto, asumir punto = miles, coma = decimal (formato es-AR).
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseEntrada(texto: string): ParseResult {
  const items: ItemMantInput[] = [];
  const errores: string[] = [];
  const trimmed = texto.trim();
  if (!trimmed) return { items, errores };

  // 1) Intentar JSON (array de objetos o de pares).
  try {
    const json = JSON.parse(trimmed);
    if (Array.isArray(json)) {
      json.forEach((row, idx) => {
        const nombre = row?.nombre ?? row?.descripcion ?? row?.name ?? (Array.isArray(row) ? row[0] : undefined);
        const precioRaw = row?.precio_anual ?? row?.precio ?? row?.valor ?? (Array.isArray(row) ? row[1] : undefined);
        const precio = typeof precioRaw === 'number' ? precioRaw : parseNumero(String(precioRaw ?? ''));
        if (!nombre || precio == null) {
          errores.push(`Fila ${idx + 1}: falta nombre o precio`);
          return;
        }
        items.push({ nombre: String(nombre).trim(), precio_anual: precio, orden: idx });
      });
      return { items, errores };
    }
  } catch {
    // no era JSON, seguir con CSV
  }

  // 2) CSV/pegado: una línea por ítem, separador coma/tab/punto y coma.
  const lineas = trimmed.split(/\r?\n/).filter((l) => l.trim());
  lineas.forEach((linea, idx) => {
    const partes = linea.split(/[\t;]|,(?=\s*[\d$-])/);
    if (partes.length < 2) {
      // intentar separar por la última secuencia numérica
      const m = linea.match(/^(.*?)[\s,]+([\d.,$\s]+)$/);
      if (!m) {
        errores.push(`Línea ${idx + 1}: no se pudo separar nombre y precio`);
        return;
      }
      const precio = parseNumero(m[2]);
      if (precio == null) {
        errores.push(`Línea ${idx + 1}: precio inválido`);
        return;
      }
      items.push({ nombre: m[1].trim(), precio_anual: precio, orden: idx });
      return;
    }
    const precio = parseNumero(partes[partes.length - 1]);
    const nombre = partes.slice(0, -1).join(' ').trim();
    if (!nombre || precio == null) {
      errores.push(`Línea ${idx + 1}: nombre o precio inválido`);
      return;
    }
    items.push({ nombre, precio_anual: precio, orden: idx });
  });

  return { items, errores };
}

export function ImportarItemsDialog({ costoEquipoId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(false);

  const { items, errores } = parseEntrada(texto);

  async function handleImportar() {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const count = await bulkAddItemsMantenimiento(costoEquipoId, items);
      toast.success(`${count} ítems importados`);
      setOpen(false);
      setTexto('');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al importar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Upload className="h-3.5 w-3.5" /> Importar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar ítems de mantenimiento</DialogTitle>
          <DialogDescription>
            Pegá una lista en CSV (una línea por ítem: <code>descripción, precio</code>) o un array JSON
            con <code>nombre</code> y <code>precio_anual</code>. El precio admite $ y formato 1.234,56.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="import_texto">Datos</Label>
            <Textarea
              id="import_texto"
              rows={8}
              placeholder={'Patentes, 5428525\nSeguros, 1680000\nNeumáticos 1 juego x año, 5160000'}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              className="font-mono text-xs"
            />
          </div>

          {texto.trim() && (
            <div className="rounded-md border">
              <div className="flex items-center justify-between px-3 py-2 text-sm border-b bg-muted/40">
                <span>{items.length} ítems detectados</span>
                {errores.length > 0 && (
                  <span className="text-destructive">{errores.length} con error</span>
                )}
              </div>
              {items.length > 0 && (
                <div className="max-h-48 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="text-right">Precio anual</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((it, i) => (
                        <TableRow key={i}>
                          <TableCell>{it.nombre}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrencyARS(it.precio_anual)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {errores.length > 0 && (
                <ul className="px-3 py-2 text-xs text-destructive space-y-0.5 border-t">
                  {errores.slice(0, 5).map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                  {errores.length > 5 && <li>…y {errores.length - 5} más</li>}
                </ul>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setOpen(false); setTexto(''); }}>
              Cancelar
            </Button>
            <Button onClick={handleImportar} disabled={loading || items.length === 0}>
              {loading ? 'Importando...' : `Importar ${items.length} ítems`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
