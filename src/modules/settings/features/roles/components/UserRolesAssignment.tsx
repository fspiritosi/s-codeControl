'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Checkbox } from '@/shared/components/ui/checkbox';
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
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Pencil } from 'lucide-react';
import {
  type CompanyUserWithRoles,
  type RoleSummary,
  setUserRoles,
} from '../actions.server';

interface Props {
  users: CompanyUserWithRoles[];
  roles: RoleSummary[];
  canAssign: boolean;
}

export function UserRolesAssignment({ users, roles, canAssign }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<CompanyUserWithRoles | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const rolesById = new Map(roles.map((r) => [r.id, r]));

  const openEdit = (user: CompanyUserWithRoles) => {
    setEditing(user);
    setSelectedRoles(new Set(user.role_ids));
  };

  const closeEdit = () => {
    setEditing(null);
    setSelectedRoles(new Set());
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  };

  const handleSave = () => {
    if (!editing) return;
    const profileId = editing.profile_id;
    const roleIds = Array.from(selectedRoles);
    startTransition(async () => {
      const result = await setUserRoles(profileId, roleIds);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Roles actualizados');
      closeEdit();
      router.refresh();
    });
  };

  return (
    <>
      <div>
        <h3 className="text-lg font-semibold">Asignación de roles</h3>
        <p className="text-sm text-muted-foreground">
          Cada usuario puede tener uno o más roles. Los permisos son la unión de todos los roles asignados.
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles asignados</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.profile_id}>
                <TableCell className="font-medium">
                  {u.fullname ?? <span className="italic text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-muted-foreground">{u.email ?? '—'}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {u.role_ids.length === 0 ? (
                      u.legacy_role ? (
                        <Badge variant="outline" className="italic">
                          {u.legacy_role} (legacy)
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Sin roles</span>
                      )
                    ) : (
                      u.role_ids.map((rid) => {
                        const role = rolesById.get(rid);
                        return (
                          <Badge key={rid} variant={role?.is_system ? 'secondary' : 'default'}>
                            {role?.name ?? rid}
                          </Badge>
                        );
                      })
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {canAssign && (
                    <Button size="sm" variant="ghost" onClick={() => openEdit(u)}>
                      <Pencil className="size-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                  No hay usuarios en la empresa.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(v) => !v && closeEdit()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar roles</DialogTitle>
            <DialogDescription>
              {editing?.fullname || editing?.email}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-72 rounded-md border p-3">
            <div className="space-y-2">
              {roles.map((r) => (
                <label key={r.id} className="flex items-start gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={selectedRoles.has(r.id)}
                    onCheckedChange={() => toggleRole(r.id)}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.name}</span>
                      {r.is_system && (
                        <Badge variant="secondary" className="text-xs">
                          Sistema
                        </Badge>
                      )}
                    </div>
                    {r.description && (
                      <p className="text-xs text-muted-foreground">{r.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={closeEdit}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
