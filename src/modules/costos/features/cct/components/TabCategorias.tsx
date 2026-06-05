'use client';

import { useState } from 'react';
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
import { crearCategoria, actualizarCategoria, eliminarCategoria } from '../actions.server';
import type { ConfigCCTClient } from '../../../shared/types/cct.types';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  cct: ConfigCCTClient;
}

export function TabCategorias({ cct }: Props) {
  const router = useRouter();
  const [openCrear, setOpenCrear] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [form, setForm] = useState({ codigo: '', nombre: '', orden: '0' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function resetForm() {
    setForm({ codigo: '', nombre: '', orden: '0' });
    setError('');
  }

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await crearCategoria({
        config_cct_id: cct.id,
        codigo: form.codigo,
        nombre: form.nombre,
        orden: parseInt(form.orden),
      });
      setOpenCrear(false);
      resetForm();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function handleEditar(id: string) {
    const cat = cct.categorias?.find((c) => c.id === id);
    if (!cat) return;
    setForm({ codigo: cat.codigo, nombre: cat.nombre, orden: String(cat.orden) });
    setEditando(id);
  }

  async function handleGuardarEdicion(e: React.FormEvent) {
    e.preventDefault();
    if (!editando) return;
    setLoading(true);
    setError('');
    try {
      await actualizarCategoria(editando, {
        codigo: form.codigo,
        nombre: form.nombre,
        orden: parseInt(form.orden),
      });
      setEditando(null);
      resetForm();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function handleEliminar(id: string) {
    if (!confirm('¿Eliminar esta categoría? Esta acción no se puede deshacer.')) return;
    try {
      await eliminarCategoria(id);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al eliminar');
    }
  }

  const FormBody = (
    <form onSubmit={editando ? handleGuardarEdicion : handleCrear} className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="cat_codigo">Código</Label>
          <Input
            id="cat_codigo"
            placeholder="GB"
            value={form.codigo}
            onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cat_orden">Orden</Label>
          <Input
            id="cat_orden"
            type="number"
            value={form.orden}
            onChange={(e) => setForm((f) => ({ ...f, orden: e.target.value }))}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cat_nombre">Nombre</Label>
        <Input
          id="cat_nombre"
          placeholder="Junior B"
          value={form.nombre}
          onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          required
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => { setOpenCrear(false); setEditando(null); resetForm(); }}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear categoría'}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={openCrear} onOpenChange={setOpenCrear}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Agregar categoría
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Nueva categoría</DialogTitle></DialogHeader>
            {FormBody}
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!editando} onOpenChange={(v) => { if (!v) { setEditando(null); resetForm(); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Editar categoría</DialogTitle></DialogHeader>
          {FormBody}
        </DialogContent>
      </Dialog>

      {(!cct.categorias || cct.categorias.length === 0) ? (
        <p className="text-sm text-muted-foreground text-center py-8">No hay categorías. Agregá la primera.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="w-16 text-right">Orden</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {cct.categorias?.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell className="font-mono font-medium">{cat.codigo}</TableCell>
                <TableCell>{cat.nombre}</TableCell>
                <TableCell className="text-right text-muted-foreground">{cat.orden}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEditar(cat.id)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleEliminar(cat.id)}>
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
  );
}
