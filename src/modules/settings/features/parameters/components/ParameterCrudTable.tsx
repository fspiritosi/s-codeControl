'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
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
import { Pencil, Plus, Power } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export interface ParameterRow {
  id: string;
  name: string;
  is_active: boolean | null;
  company_id: string | null;
}

interface Props {
  title: string;
  entityLabel: string;
  items: ParameterRow[];
  createAction: (name: string) => Promise<{ error: string | null }>;
  updateAction: (id: string, name: string) => Promise<{ error: string | null }>;
  toggleActiveAction: (id: string, isActive: boolean) => Promise<{ error: string | null }>;
}

export function ParameterCrudTable({
  title,
  entityLabel,
  items,
  createAction,
  updateAction,
  toggleActiveAction,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ParameterRow | null>(null);
  const [name, setName] = useState('');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingToggle, setPendingToggle] = useState<ParameterRow | null>(null);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setDialogOpen(true);
  };

  const openEdit = (item: ParameterRow) => {
    setEditing(item);
    setName(item.name);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('El nombre no puede estar vacío');
      return;
    }
    startTransition(async () => {
      const result = editing ? await updateAction(editing.id, trimmed) : await createAction(trimmed);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(editing ? `${entityLabel} actualizado` : `${entityLabel} creado`);
      setDialogOpen(false);
      router.refresh();
    });
  };

  const handleToggle = async () => {
    if (!pendingToggle) return;
    const newState = !pendingToggle.is_active;
    startTransition(async () => {
      const result = await toggleActiveAction(pendingToggle.id, newState);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(newState ? `${entityLabel} habilitado` : `${entityLabel} deshabilitado`);
      setConfirmOpen(false);
      setPendingToggle(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4 mr-1" /> Nuevo
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="w-[140px]">Origen</TableHead>
              <TableHead className="w-[120px]">Estado</TableHead>
              <TableHead className="w-[120px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                  Sin registros. Agregá el primero con &quot;Nuevo&quot;.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const isSeed = item.company_id === null;
                return (
                  <TableRow key={item.id} className={!item.is_active ? 'opacity-60' : ''}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      {isSeed ? (
                        <Badge variant="outline" className="text-xs">Sistema</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Propio</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.is_active ? 'default' : 'destructive'}>
                        {item.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {!isSeed && (
                        <div className="flex justify-end gap-1">
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
                            title={item.is_active ? 'Deshabilitar' : 'Habilitar'}
                          >
                            <Power className="size-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? `Editar ${entityLabel.toLowerCase()}` : `Nuevo ${entityLabel.toLowerCase()}`}
            </DialogTitle>
            <DialogDescription>
              {editing ? 'Modificá el nombre y guardá.' : `Ingresá el nombre del nuevo ${entityLabel.toLowerCase()}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
            />
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
              {pendingToggle?.is_active ? 'Deshabilitar' : 'Habilitar'} {entityLabel.toLowerCase()}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingToggle?.is_active
                ? `Los empleados que ya tienen "${pendingToggle?.name}" asignado conservan el valor, pero no aparecerá en nuevas asignaciones.`
                : `"${pendingToggle?.name}" volverá a estar disponible para asignar a empleados.`}
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
