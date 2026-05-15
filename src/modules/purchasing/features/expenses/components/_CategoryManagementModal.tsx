'use client';

import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Settings, Plus, Edit2, Check, X, Power } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Separator } from '@/shared/components/ui/separator';
import { cn } from '@/shared/lib/utils';

import {
  getAllExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
  toggleExpenseCategory,
} from '../actions.server';
import { expenseCategoryFormSchema, type ExpenseCategoryFormInput } from '../validators';

type CategoryItem = Awaited<ReturnType<typeof getAllExpenseCategories>>[number];

interface EditState {
  id: string;
  name: string;
  description: string;
}

interface CategoryManagementModalProps {
  trigger?: ReactNode;
  onClose?: () => void;
}

export function _CategoryManagementModal({ trigger, onClose }: CategoryManagementModalProps) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const createForm = useForm<ExpenseCategoryFormInput>({
    resolver: zodResolver(expenseCategoryFormSchema),
    defaultValues: { name: '', description: '' },
  });

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await getAllExpenseCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error al cargar categorias:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: ExpenseCategoryFormInput) => {
    try {
      await createExpenseCategory(data);
      toast.success('Categoria creada correctamente');
      createForm.reset();
      await loadCategories();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear categoria');
    }
  };

  const handleEditSave = async (category: CategoryItem) => {
    if (!editState) return;

    try {
      await updateExpenseCategory(category.id, {
        name: editState.name,
        description: editState.description || null,
      });
      toast.success('Categoria actualizada correctamente');
      setEditState(null);
      await loadCategories();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar categoria');
    }
  };

  const handleToggle = async (category: CategoryItem) => {
    setTogglingId(category.id);
    try {
      await toggleExpenseCategory(category.id);
      toast.success(category.is_active ? 'Categoria desactivada' : 'Categoria activada');
      await loadCategories();
    } catch (error) {
      console.error('Error al toggle categoria:', error);
      toast.error(error instanceof Error ? error.message : 'Error al cambiar estado');
    } finally {
      setTogglingId(null);
    }
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (value) {
      loadCategories();
    } else {
      setEditState(null);
      onClose?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Gestionar Categorias
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestion de Categorias</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Nueva categoria */}
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-3">
              <h3 className="text-sm font-medium">Nueva Categoria</h3>
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre de la categoria" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripcion (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descripcion de la categoria"
                        rows={2}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" size="sm" disabled={createForm.formState.isSubmitting}>
                <Plus className="mr-2 h-4 w-4" />
                {createForm.formState.isSubmitting ? 'Creando...' : 'Agregar'}
              </Button>
            </form>
          </Form>

          <Separator />

          {/* Lista de categorias */}
          <div>
            <h3 className="text-sm font-medium mb-3">Categorias existentes</h3>

            {loading && (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            )}

            {!loading && categories.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay categorias creadas aun
              </p>
            )}

            {!loading && categories.length > 0 && (
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={cn(
                      'p-3 border rounded-lg',
                      !category.is_active && 'opacity-60 bg-muted/30',
                    )}
                  >
                    {editState?.id === category.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editState.name}
                          onChange={(e) =>
                            setEditState((prev) => (prev ? { ...prev, name: e.target.value } : null))
                          }
                          placeholder="Nombre"
                          className="h-8 text-sm"
                        />
                        <Input
                          value={editState.description}
                          onChange={(e) =>
                            setEditState((prev) =>
                              prev ? { ...prev, description: e.target.value } : null,
                            )
                          }
                          placeholder="Descripcion (opcional)"
                          className="h-8 text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="default"
                            className="h-7 text-xs"
                            onClick={() => handleEditSave(category)}
                          >
                            <Check className="mr-1 h-3 w-3" />
                            Guardar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => setEditState(null)}
                          >
                            <X className="mr-1 h-3 w-3" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{category.name}</p>
                            {!category.is_active && (
                              <Badge variant="secondary" className="text-xs">
                                Inactiva
                              </Badge>
                            )}
                          </div>
                          {category.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {category.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {category._count.expenses} gasto{category._count.expenses !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              setEditState({
                                id: category.id,
                                name: category.name,
                                description: category.description ?? '',
                              })
                            }
                            title="Editar"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={togglingId === category.id}
                            onClick={() => handleToggle(category)}
                            title={category.is_active ? 'Desactivar' : 'Activar'}
                          >
                            <Power
                              className={cn(
                                'h-3.5 w-3.5',
                                category.is_active ? 'text-green-600' : 'text-muted-foreground',
                              )}
                            />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
