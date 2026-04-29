'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, Link as LinkIcon, Unlink } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
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
import {
  createCompanyGroup,
  updateCompanyGroup,
  deleteCompanyGroup,
  setCompanyGroup,
} from '../actions.server';

interface CompanyMini {
  id: string;
  company_name: string;
  company_cuit: string;
}

interface Group {
  id: string;
  name: string;
  companies: CompanyMini[];
}

interface CompanyWithGroup extends CompanyMini {
  company_group_id: string | null;
}

interface Props {
  groups: Group[];
  allCompanies: CompanyWithGroup[];
}

export function CompanyGroupsView({ groups, allCompanies }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');

  const [editing, setEditing] = useState<Group | null>(null);
  const [editName, setEditName] = useState('');

  const [deleting, setDeleting] = useState<Group | null>(null);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignCompanyId, setAssignCompanyId] = useState<string>('');
  const [assignGroupId, setAssignGroupId] = useState<string>('');

  const handleCreate = () => {
    startTransition(async () => {
      const result = await createCompanyGroup(newName);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Grupo creado');
      setCreateOpen(false);
      setNewName('');
      router.refresh();
    });
  };

  const handleEdit = () => {
    if (!editing) return;
    startTransition(async () => {
      const result = await updateCompanyGroup(editing.id, editName);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Grupo actualizado');
      setEditing(null);
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteCompanyGroup(deleting.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Grupo eliminado');
      setDeleting(null);
      router.refresh();
    });
  };

  const handleAssign = () => {
    if (!assignCompanyId) {
      toast.error('Seleccioná una empresa');
      return;
    }
    startTransition(async () => {
      const result = await setCompanyGroup(assignCompanyId, assignGroupId || null);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(assignGroupId ? 'Empresa asignada al grupo' : 'Empresa desvinculada');
      setAssignOpen(false);
      setAssignCompanyId('');
      setAssignGroupId('');
      router.refresh();
    });
  };

  const handleUnassign = (companyId: string) => {
    startTransition(async () => {
      const result = await setCompanyGroup(companyId, null);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Empresa desvinculada del grupo');
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Grupos compartidos</h1>
          <p className="text-sm text-muted-foreground">
            Las empresas dentro del mismo grupo comparten almacenes, productos y stock.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={assignOpen} onOpenChange={(v) => !isPending && setAssignOpen(v)}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <LinkIcon className="size-4 mr-2" /> Asignar empresa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>Asignar empresa a grupo</DialogTitle>
                <DialogDescription>
                  Cambiar el grupo no afecta los almacenes ni los stocks existentes — solo cambia la
                  visibilidad para las empresas del grupo.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Empresa</Label>
                  <Select value={assignCompanyId} onValueChange={setAssignCompanyId} disabled={isPending}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {allCompanies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.company_name}
                          {c.company_group_id && (
                            <span className="text-xs text-muted-foreground ml-2">
                              (en grupo: {groups.find((g) => g.id === c.company_group_id)?.name})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Grupo</Label>
                  <Select value={assignGroupId} onValueChange={setAssignGroupId} disabled={isPending}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar grupo (vacío = quitar del grupo)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin grupo</SelectItem>
                      {groups.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAssignOpen(false)} disabled={isPending}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    if (assignGroupId === '__none__') {
                      // unassign
                      startTransition(async () => {
                        const result = await setCompanyGroup(assignCompanyId, null);
                        if (result.error) {
                          toast.error(result.error);
                          return;
                        }
                        toast.success('Empresa desvinculada');
                        setAssignOpen(false);
                        setAssignCompanyId('');
                        setAssignGroupId('');
                        router.refresh();
                      });
                    } else {
                      handleAssign();
                    }
                  }}
                  disabled={isPending || !assignCompanyId}
                >
                  {isPending ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                  Guardar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={createOpen} onOpenChange={(v) => !isPending && setCreateOpen(v)}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4 mr-2" /> Nuevo grupo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[420px]">
              <DialogHeader>
                <DialogTitle>Nuevo grupo</DialogTitle>
                <DialogDescription>Definí el nombre del grupo. Después podés asignarle empresas.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2 py-2">
                <Label>Nombre</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: Grupo SP"
                  disabled={isPending}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={isPending}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={isPending || !newName.trim()}>
                  {isPending ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                  Crear
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Todavía no hay grupos creados. Creá uno para empezar a compartir almacenes y productos
            entre empresas.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((g) => (
            <Card key={g.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle>{g.name}</CardTitle>
                  <CardDescription>
                    {g.companies.length === 0
                      ? 'Sin empresas asignadas'
                      : `${g.companies.length} ${g.companies.length === 1 ? 'empresa' : 'empresas'}`}
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditing(g);
                      setEditName(g.name);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleting(g)}>
                    <Trash2 className="size-4 text-red-600" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {g.companies.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Asigná empresas usando el botón &quot;Asignar empresa&quot;.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {g.companies.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center justify-between rounded border px-3 py-2 text-sm"
                      >
                        <div>
                          <p className="font-medium">{c.company_name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{c.company_cuit}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnassign(c.id)}
                          disabled={isPending}
                        >
                          <Unlink className="size-4 mr-1" /> Quitar
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(v) => !isPending && !v && setEditing(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Renombrar grupo</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Nombre</Label>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} disabled={isPending} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={isPending || !editName.trim()}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(v) => !isPending && !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar el grupo &quot;{deleting?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              Las empresas del grupo quedarán sin asignar y dejarán de ver los datos compartidos.
              Los almacenes y stocks no se eliminan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
