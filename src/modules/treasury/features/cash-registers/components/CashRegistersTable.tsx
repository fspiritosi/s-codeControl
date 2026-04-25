'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Label } from '@/shared/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { Eye, Pencil, Plus, Power } from 'lucide-react';
import { toast } from 'sonner';
import {
  createCashRegister,
  updateCashRegister,
  toggleCashRegisterActive,
} from '../actions.server';
import { CASH_REGISTER_STATUS_LABELS } from '../../../shared/validators';

interface CashRegisterRow {
  id: string;
  code: string;
  name: string;
  location: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  is_default: boolean;
}

export function CashRegistersTable({ items }: { items: CashRegisterRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CashRegisterRow | null>(null);
  const [form, setForm] = useState({ code: '', name: '', location: '', is_default: false });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingToggle, setPendingToggle] = useState<CashRegisterRow | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm({ code: '', name: '', location: '', is_default: false });
    setDialogOpen(true);
  };

  const openEdit = (item: CashRegisterRow) => {
    setEditing(item);
    setForm({
      code: item.code,
      name: item.name,
      location: item.location ?? '',
      is_default: item.is_default,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    startTransition(async () => {
      const payload = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        location: form.location.trim() || null,
        is_default: form.is_default,
      };
      const result = editing
        ? await updateCashRegister(editing.id, payload)
        : await createCashRegister(payload);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(editing ? 'Caja actualizada' : 'Caja creada');
      setDialogOpen(false);
      router.refresh();
    });
  };

  const handleToggle = async () => {
    if (!pendingToggle) return;
    startTransition(async () => {
      const result = await toggleCashRegisterActive(pendingToggle.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        pendingToggle.status === 'ACTIVE' ? 'Caja desactivada' : 'Caja activada'
      );
      setConfirmOpen(false);
      setPendingToggle(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Cajas físicas</h2>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4 mr-1" /> Nueva caja
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead className="w-[110px]">Predeterminada</TableHead>
              <TableHead className="w-[110px]">Estado</TableHead>
              <TableHead className="w-[140px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  Sin cajas. Creá la primera con &quot;Nueva caja&quot;.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id} className={item.status === 'INACTIVE' ? 'opacity-60' : ''}>
                  <TableCell className="font-mono font-medium">{item.code}</TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.location ?? '-'}</TableCell>
                  <TableCell>{item.is_default ? <Badge variant="outline">Sí</Badge> : '-'}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'ACTIVE' ? 'default' : 'destructive'}>
                      {CASH_REGISTER_STATUS_LABELS[item.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="size-8" asChild title="Ver detalle">
                        <Link href={`/dashboard/treasury/cash-registers/${item.id}`}>
                          <Eye className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => openEdit(item)}
                        title="Editar"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => {
                          setPendingToggle(item);
                          setConfirmOpen(true);
                        }}
                        title={item.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
                      >
                        <Power className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar caja' : 'Nueva caja'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Modificá los datos de la caja.'
                : 'Creá una nueva caja física (ej: CAJA-01).'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Código</Label>
              <Input
                autoFocus
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="CAJA-01"
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Caja principal"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ubicación (opcional)</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="Oficina central"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={form.is_default}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_default: v === true }))}
              />
              <span className="text-sm">Marcar como caja predeterminada</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingToggle?.status === 'ACTIVE' ? 'Desactivar' : 'Activar'} caja
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingToggle?.status === 'ACTIVE'
                ? `"${pendingToggle?.name}" no podrá recibir nuevas sesiones ni movimientos.`
                : `"${pendingToggle?.name}" volverá a estar operativa.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggle} disabled={isPending}>
              {isPending ? 'Procesando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
