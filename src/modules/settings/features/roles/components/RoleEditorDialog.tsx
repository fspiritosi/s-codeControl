'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Badge } from '@/shared/components/ui/badge';
import {
  type PermissionItem,
  type RoleSummary,
  createCustomRole,
  getRoleDetail,
  updateCustomRole,
} from '../actions.server';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  permissions: PermissionItem[];
  /** undefined = create mode; RoleSummary = edit mode */
  role?: RoleSummary;
}

const roleSchema = z.object({
  name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(64, 'Máximo 64 caracteres'),
  description: z.string().trim().max(255).optional(),
});

const MODULE_LABELS: Record<string, string> = {
  empresa: 'Empresa',
  empleados: 'Empleados',
  equipos: 'Equipos',
  documentacion: 'Documentación',
  mantenimiento: 'Mantenimiento',
  dashboard: 'Dashboard',
  ayuda: 'Ayuda',
  operaciones: 'Operaciones',
  formularios: 'Formularios',
  proveedores: 'Proveedores',
  almacenes: 'Almacenes',
  compras: 'Compras',
  tesoreria: 'Tesorería',
  configuracion: 'Configuración',
};

const ACTION_LABELS: Record<string, string> = {
  view: 'Ver',
  create: 'Crear',
  update: 'Editar',
  delete: 'Eliminar',
  approve: 'Aprobar',
  confirm: 'Confirmar',
  pay: 'Pagar',
  assign: 'Asignar',
};

export function RoleEditorDialog({ open, onOpenChange, permissions, role }: Props) {
  const router = useRouter();
  const isEdit = !!role;
  const isReadOnly = !!role?.is_system;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  // Cargar detalle al abrir en modo edición.
  useEffect(() => {
    if (!open) return;
    if (!role) {
      setName('');
      setDescription('');
      setSelected(new Set());
      setLoaded(true);
      return;
    }
    setLoaded(false);
    setName(role.name);
    setDescription(role.description ?? '');
    getRoleDetail(role.id).then((detail) => {
      if (detail) setSelected(new Set(detail.permission_codes));
      setLoaded(true);
    });
  }, [open, role]);

  // Agrupar permisos por módulo
  const grouped = useMemo(() => {
    const map = new Map<string, PermissionItem[]>();
    for (const p of permissions) {
      const key = p.module ?? 'otros';
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [permissions]);

  const togglePermission = (code: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const toggleModule = (codes: string[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const allOn = codes.every((c) => next.has(c));
      if (allOn) codes.forEach((c) => next.delete(c));
      else codes.forEach((c) => next.add(c));
      return next;
    });
  };

  const handleSubmit = () => {
    const parsed = roleSchema.safeParse({ name, description });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Datos inválidos');
      return;
    }

    startTransition(async () => {
      const payload = {
        name: parsed.data.name,
        description: parsed.data.description,
        permission_codes: Array.from(selected),
      };
      const result = isEdit
        ? await updateCustomRole(role!.id, payload)
        : await createCustomRole(payload);

      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? 'Rol actualizado' : 'Rol creado');
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? (isReadOnly ? 'Detalle del rol' : 'Editar rol') : 'Crear rol'}
          </DialogTitle>
          <DialogDescription>
            {isReadOnly
              ? 'Los roles de sistema no se pueden modificar. Podés crear un rol custom basado en estos permisos.'
              : 'Definí qué acciones puede realizar este rol marcando los permisos correspondientes.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="role-name">Nombre</Label>
            <Input
              id="role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isReadOnly}
              placeholder="Ej. Tesorería Sr"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role-desc">Descripción</Label>
            <Textarea
              id="role-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isReadOnly}
              placeholder="Para qué se usa este rol"
              rows={2}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Permisos</Label>
              <Badge variant="outline">{selected.size} seleccionados</Badge>
            </div>

            <ScrollArea className="h-72 rounded-md border p-3">
              {!loaded ? (
                <p className="text-sm text-muted-foreground">Cargando permisos…</p>
              ) : (
                <div className="space-y-4">
                  {grouped.map(([moduleKey, perms]) => {
                    const codes = perms.map((p) => p.code);
                    const allSelected = codes.every((c) => selected.has(c));
                    const someSelected = codes.some((c) => selected.has(c));
                    return (
                      <div key={moduleKey} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                            onCheckedChange={() => !isReadOnly && toggleModule(codes)}
                            disabled={isReadOnly}
                          />
                          <span className="font-medium text-sm">
                            {MODULE_LABELS[moduleKey] ?? moduleKey}
                          </span>
                        </div>
                        <div className="ml-6 grid grid-cols-2 gap-2">
                          {perms.map((p) => (
                            <label
                              key={p.code}
                              className="flex items-center gap-2 text-sm cursor-pointer"
                            >
                              <Checkbox
                                checked={selected.has(p.code)}
                                onCheckedChange={() => !isReadOnly && togglePermission(p.code)}
                                disabled={isReadOnly}
                              />
                              <span>{ACTION_LABELS[p.action] ?? p.action}</span>
                              {p.description && (
                                <span className="text-xs text-muted-foreground">
                                  — {p.description}
                                </span>
                              )}
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isReadOnly ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!isReadOnly && (
            <Button onClick={handleSubmit} disabled={isPending || !loaded}>
              {isEdit ? 'Guardar cambios' : 'Crear rol'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
