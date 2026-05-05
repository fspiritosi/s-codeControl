'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { Pencil, Plus, Trash2, Eye } from 'lucide-react';
import { RoleEditorDialog } from './RoleEditorDialog';
import {
  type PermissionItem,
  type RoleSummary,
  deleteCustomRole,
} from '../actions.server';

interface Props {
  roles: RoleSummary[];
  permissions: PermissionItem[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export function RolesList({ roles, permissions, canCreate, canUpdate, canDelete }: Props) {
  const router = useRouter();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<RoleSummary | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const openCreate = () => {
    setEditing(undefined);
    setEditorOpen(true);
  };
  const openEdit = (role: RoleSummary) => {
    setEditing(role);
    setEditorOpen(true);
  };

  const handleDelete = () => {
    if (!deletingId) return;
    const id = deletingId;
    setDeletingId(null);
    startTransition(async () => {
      const result = await deleteCustomRole(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Rol eliminado');
      router.refresh();
    });
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Roles</h3>
          <p className="text-sm text-muted-foreground">
            Los roles de sistema están protegidos y no se pueden editar ni eliminar.
          </p>
        </div>
        {canCreate && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4 mr-1" /> Nuevo rol
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-center">Permisos</TableHead>
              <TableHead className="text-center">Tipo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {r.description ?? <span className="italic">—</span>}
                </TableCell>
                <TableCell className="text-center">{r.permissions_count}</TableCell>
                <TableCell className="text-center">
                  {r.is_system ? (
                    <Badge variant="secondary">Sistema</Badge>
                  ) : (
                    <Badge variant="outline">Custom</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {r.is_system ? (
                      <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
                        <Eye className="size-4" />
                      </Button>
                    ) : (
                      <>
                        {canUpdate && (
                          <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
                            <Pencil className="size-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeletingId(r.id)}
                            disabled={isPending}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {roles.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                  No hay roles configurados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <RoleEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        permissions={permissions}
        role={editing}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(v) => !v && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar rol</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar este rol. Los usuarios que lo tengan asignado dejarán de
              tener los permisos asociados. Esta acción no se puede revertir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
