'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/shared/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/shared/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import {
  addItemCostoTipo, updateItemCostoTipo, deleteItemCostoTipo, ensureCostoTipoEquipo,
} from '../actions.server';
import { ImportarItemsDialog } from './ImportarItemsDialog';
import type { ClaseItemCosto, ItemCostoTipoClient } from '@/modules/costos/shared/types/tipo-equipo.types';
import { formatCurrencyARS, formatDateUTC } from '@/shared/lib/utils/formatters';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export type ProductoOption = { id: string; code: string; name: string; cost_price: number };

interface Props {
  clase: ClaseItemCosto;
  typeId: string;
  perfilId: string | null;
  items: ItemCostoTipoClient[];
  /**
   * Total exacto de la clase, calculado en el servidor en Decimal sobre los valores
   * crudos. No se recalcula acá sumando los `subtotal`: esos ya vienen redondeados a 2
   * decimales por ítem y sumarlos en float arrastraría ese error, mostrando un total
   * distinto al del listado de tipos para el mismo tipo de equipo.
   */
  total: number;
  productos: ProductoOption[];
}

const COPY = {
  ACCESORIO: {
    titulo: 'Accesorios',
    cantidad: 'Cantidad',
    total: 'Total accesorios (a la base amortizable)',
    placeholder: 'Butacas reclinables',
    vacio: 'No hay accesorios cargados para este tipo.',
  },
  MANTENIMIENTO: {
    titulo: 'Mantenimiento',
    cantidad: 'Cantidad anual',
    total: 'Mantenimiento anual',
    placeholder: 'Neumáticos 315/80 R22.5',
    vacio: 'No hay ítems de mantenimiento cargados para este tipo.',
  },
} as const;

const EMPTY = { nombre: '', product_id: '', cantidad: '1', precio_unitario: '' };

export function TablaItemsCostoTipo({ clase, typeId, perfilId, items, total, productos }: Props) {
  const router = useRouter();
  const copy = COPY[clase];
  const [openNuevo, setOpenNuevo] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const opciones = productos.map((p) => ({ value: p.id, label: `${p.code} · ${p.name}` }));

  function reset() { setForm(EMPTY); }

  function elegirProducto(productId: string) {
    const p = productos.find((x) => x.id === productId);
    setForm((f) => ({
      ...f,
      product_id: productId,
      nombre: f.nombre || (p?.name ?? ''),
      precio_unitario: p ? String(p.cost_price) : f.precio_unitario,
    }));
  }

  async function handleNuevo(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const id = perfilId ?? (await ensureCostoTipoEquipo(typeId));
      await addItemCostoTipo(id, {
        clase,
        nombre: form.nombre,
        product_id: form.product_id || null,
        cantidad: Number(form.cantidad),
        precio_unitario: Number(form.precio_unitario),
        orden: items.length,
      });
      setOpenNuevo(false);
      reset();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  function abrirEdicion(item: ItemCostoTipoClient) {
    setForm({
      nombre: item.nombre,
      product_id: item.product_id ?? '',
      cantidad: String(item.cantidad),
      precio_unitario: String(item.precio_unitario),
    });
    setEditando(item.id);
  }

  async function handleEditar(e: React.FormEvent) {
    e.preventDefault();
    if (!editando) return;
    setLoading(true);
    try {
      await updateItemCostoTipo(editando, {
        nombre: form.nombre,
        product_id: form.product_id || null,
        cantidad: Number(form.cantidad),
        precio_unitario: Number(form.precio_unitario),
      });
      setEditando(null);
      reset();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function handleEliminar(id: string) {
    if (!confirm('¿Eliminar este ítem?')) return;
    try {
      await deleteItemCostoTipo(id);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  const FormBody = (onSubmit: (e: React.FormEvent) => void, submitLabel: string) => (
    <form onSubmit={onSubmit} className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label>Producto de almacén (opcional)</Label>
        <SearchableSelect
          options={opciones}
          value={form.product_id}
          onValueChange={elegirProducto}
          placeholder="Sin vincular"
          searchPlaceholder="Buscar producto..."
        />
        <p className="text-xs text-muted-foreground">
          Vincularlo permite refrescar el precio desde el almacén.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="item_nombre">Descripción</Label>
        <Input
          id="item_nombre"
          placeholder={copy.placeholder}
          value={form.nombre}
          onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="item_cantidad">{copy.cantidad}</Label>
          <Input
            id="item_cantidad" type="number" step="0.001" min="0.001"
            value={form.cantidad}
            onChange={(e) => setForm((f) => ({ ...f, cantidad: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="item_precio">Precio unitario</Label>
          <Input
            id="item_precio" type="number" step="0.01" min="0"
            value={form.precio_unitario}
            onChange={(e) => setForm((f) => ({ ...f, precio_unitario: e.target.value }))}
            required
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost"
          onClick={() => { setOpenNuevo(false); setEditando(null); reset(); }}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : submitLabel}
        </Button>
      </div>
    </form>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{copy.titulo} ({items.length})</CardTitle>
        <div className="flex gap-2">
          {/* La importación masiva necesita un perfil ya creado; con perfilId null se
              carga el primer ítem desde "Agregar", que lo crea. */}
          {perfilId && (
            <ImportarItemsDialog perfilId={perfilId} clase={clase} ordenInicial={items.length} />
          )}
          <Dialog open={openNuevo} onOpenChange={setOpenNuevo}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Agregar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Nuevo ítem</DialogTitle></DialogHeader>
              {FormBody(handleNuevo, 'Agregar')}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Dialog open={!!editando} onOpenChange={(v) => { if (!v) { setEditando(null); reset(); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Editar ítem</DialogTitle></DialogHeader>
            {FormBody(handleEditar, 'Guardar cambios')}
          </DialogContent>
        </Dialog>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{copy.vacio}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right w-28">{copy.cantidad}</TableHead>
                <TableHead className="text-right w-36">Precio unitario</TableHead>
                <TableHead className="text-right w-36">Subtotal</TableHead>
                <TableHead className="w-32">Últ. refresco</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.nombre}</TableCell>
                  <TableCell>
                    {item.product_code
                      ? <Badge variant="secondary">{item.product_code}</Badge>
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right font-mono">{item.cantidad}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrencyARS(item.precio_unitario)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrencyARS(item.subtotal)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {item.precio_actualizado_at ? formatDateUTC(item.precio_actualizado_at) : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => abrirEdicion(item)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                        onClick={() => handleEliminar(item.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2">
                <TableCell className="font-medium" colSpan={4}>{copy.total}</TableCell>
                <TableCell className="text-right font-mono font-medium">{formatCurrencyARS(total)}</TableCell>
                <TableCell />
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
