'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Settings } from 'lucide-react';
import { format } from 'date-fns';

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
import { SearchableSelect, type SearchableSelectOption } from '@/shared/components/ui/searchable-select';

import { expenseFormSchema, type ExpenseFormInput } from '../../validators';
import {
  createExpense,
  updateExpense,
  getExpenseById,
  getExpenseCategories,
  getSuppliersForExpenses,
} from '../../actions.server';
import { _CategoryManagementModal } from '../../components/_CategoryManagementModal';

interface CreateExpenseModalProps {
  expenseId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function _CreateExpenseModal({
  expenseId,
  open: controlledOpen,
  onOpenChange,
  onSuccess,
}: CreateExpenseModalProps) {
  const isEditMode = Boolean(expenseId);
  const [internalOpen, setInternalOpen] = useState(false);
  const [categories, setCategories] = useState<SearchableSelectOption[]>([]);
  const [suppliers, setSuppliers] = useState<SearchableSelectOption[]>([]);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value);
    } else {
      setInternalOpen(value);
    }
  };

  const form = useForm<ExpenseFormInput>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: '',
      amount: '',
      date: new Date(),
      due_date: null,
      category_id: '',
      supplier_id: '',
      notes: '',
    },
  });

  // Load catalogs when modal opens
  useEffect(() => {
    if (!open) return;

    getExpenseCategories()
      .then((cats) =>
        setCategories(cats.map((c) => ({ value: c.id, label: c.name }))),
      )
      .catch(console.error);

    getSuppliersForExpenses()
      .then((sups) =>
        setSuppliers(
          sups.map((s) => ({
            value: s.id,
            label: `${s.business_name} (${s.tax_id})`,
          })),
        ),
      )
      .catch(console.error);
  }, [open]);

  // Load expense data for editing
  useEffect(() => {
    if (isEditMode && expenseId && open) {
      getExpenseById(expenseId).then((data) => {
        form.reset({
          description: data.description,
          amount: data.amount.toString(),
          date: new Date(data.date),
          due_date: data.due_date ? new Date(data.due_date) : null,
          category_id: data.category.id,
          supplier_id: data.supplier?.id ?? '',
          notes: data.notes ?? '',
        });
      });
    }
  }, [isEditMode, expenseId, open, form]);

  const reloadCategories = () => {
    getExpenseCategories()
      .then((cats) =>
        setCategories(cats.map((c) => ({ value: c.id, label: c.name }))),
      )
      .catch(console.error);
  };

  const onSubmit = async (data: ExpenseFormInput) => {
    try {
      if (isEditMode && expenseId) {
        await updateExpense(expenseId, data);
        toast.success('Gasto actualizado correctamente');
      } else {
        await createExpense(data);
        toast.success('Gasto creado correctamente');
      }

      setOpen(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar el gasto');
    }
  };

  const content = (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{isEditMode ? 'Editar Gasto' : 'Nuevo Gasto'}</DialogTitle>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Descripcion */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripcion *</FormLabel>
                <FormControl>
                  <Input placeholder="Descripcion del gasto" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Monto y Fecha */}
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha *</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val ? new Date(val + 'T12:00:00') : null);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Fecha de Vencimiento */}
          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Vencimiento (opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val ? new Date(val + 'T12:00:00') : null);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Categoria */}
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Categoria *</FormLabel>
                  <_CategoryManagementModal
                    trigger={
                      <Button type="button" variant="ghost" size="sm" className="h-6 gap-1 text-xs">
                        <Settings className="h-3 w-3" />
                        Gestionar
                      </Button>
                    }
                    onClose={reloadCategories}
                  />
                </div>
                <FormControl>
                  <SearchableSelect
                    options={categories}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Seleccionar categoria"
                    searchPlaceholder="Buscar categoria..."
                    emptyMessage="No hay categorias disponibles"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Proveedor */}
          <FormField
            control={form.control}
            name="supplier_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proveedor (opcional)</FormLabel>
                <FormControl>
                  <SearchableSelect
                    options={[{ value: '', label: 'Sin proveedor' }, ...suppliers]}
                    value={field.value ?? ''}
                    onValueChange={(val) => field.onChange(val || '')}
                    placeholder="Seleccionar proveedor (opcional)"
                    searchPlaceholder="Buscar proveedor..."
                    emptyMessage="Sin resultados"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Notas */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas (opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Observaciones adicionales"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? isEditMode
                  ? 'Guardando...'
                  : 'Creando...'
                : isEditMode
                  ? 'Guardar Cambios'
                  : 'Crear Gasto'}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );

  if (isEditMode) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {content}
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Gasto
        </Button>
      </DialogTrigger>
      {content}
    </Dialog>
  );
}
