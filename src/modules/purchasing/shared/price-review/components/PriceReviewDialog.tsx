'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Loader2 } from 'lucide-react';
import type { PriceDifference } from '../actions.server';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  differences: PriceDifference[];
  loading?: boolean;
  applying?: boolean;
  onApply: (lineIds: string[]) => void;
}

export function PriceReviewDialog({
  open,
  onOpenChange,
  differences,
  loading = false,
  applying = false,
  onApply,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      setSelected(new Set(differences.map((d) => d.lineId)));
    }
  }, [open, differences]);

  const allChecked = differences.length > 0 && selected.size === differences.length;
  const someChecked = selected.size > 0 && selected.size < differences.length;

  const toggleAll = () => {
    if (allChecked) {
      setSelected(new Set());
    } else {
      setSelected(new Set(differences.map((d) => d.lineId)));
    }
  };

  const toggleOne = (lineId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(lineId)) next.delete(lineId);
      else next.add(lineId);
      return next;
    });
  };

  const handleApply = () => {
    onApply(Array.from(selected));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Revisar precios</DialogTitle>
          <DialogDescription>
            Comparación entre el precio cargado en el documento y el costo actual del producto.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : differences.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Valores actualizados. No hay diferencias entre los precios cargados y el costo actual de los productos.
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allChecked ? true : someChecked ? 'indeterminate' : false}
                      onCheckedChange={toggleAll}
                      aria-label="Marcar todos"
                    />
                  </TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Precio actual</TableHead>
                  <TableHead className="text-right">Precio nuevo</TableHead>
                  <TableHead className="text-right">Diferencia</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {differences.map((d) => {
                  const checked = selected.has(d.lineId);
                  const positive = d.difference > 0;
                  return (
                    <TableRow key={d.lineId}>
                      <TableCell>
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleOne(d.lineId)}
                          aria-label={`Seleccionar ${d.productName}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{d.productName}</div>
                        {d.productSku && (
                          <div className="text-xs text-muted-foreground font-mono">{d.productSku}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${d.currentPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${d.newPrice.toFixed(2)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono ${positive ? 'text-red-600' : 'text-emerald-600'}`}
                      >
                        {positive ? '+' : ''}
                        {d.difference.toFixed(2)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono ${positive ? 'text-red-600' : 'text-emerald-600'}`}
                      >
                        {positive ? '+' : ''}
                        {d.diffPercent.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <DialogFooter>
          {differences.length === 0 ? (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={applying}>
                Cancelar
              </Button>
              <Button onClick={handleApply} disabled={selected.size === 0 || applying}>
                {applying && <Loader2 className="size-4 mr-2 animate-spin" />}
                Actualizar precios ({selected.size})
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
