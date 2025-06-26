'use client';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { Checkbox } from '@/components/ui/checkbox';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { createArea, fetchAllTags, updateTag } from '../../actions/actions';

const tagSchema = z.object({
  name: z.string().nonempty({ message: 'El nombre es requerido' }),
  color: z.string().nonempty({ message: 'La descripción corta es requerida' }),
  is_active: z.boolean().default(true),
});

type Area = Awaited<ReturnType<typeof fetchAllTags>>[0];
interface AreaFormProps {
  mode: 'create' | 'edit';
  setMode: (mode: 'create' | 'edit') => void;
  selectedTag: Area | null;
  setSelectedTag: (tag: Area | null) => void;
  tags: Area[];
}

type AreaFormValues = z.infer<typeof tagSchema>;

function TagForm({ mode, setMode, selectedTag, setSelectedTag, tags }: AreaFormProps) {
  const form = useForm<AreaFormValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: '',
      color: '',
      is_active: true,
    },
  });

  const { reset } = form;
  const router = useRouter();

  // Cargar datos cuando cambia el modo o el área seleccionada
  useEffect(() => {
    if (mode === 'edit' && selectedTag) {
      reset({
        name: selectedTag.name,
        color: selectedTag.color || '',
        is_active: selectedTag.is_active,
      });
    } else if (mode === 'create') {
      reset({
        name: '',
        color: '',
        is_active: true,
      });
    }
  }, [mode, selectedTag, reset]);

  const handleSubmit = async (values: AreaFormValues) => {
    toast.promise(
      (async () => {
        if (mode === 'edit' && selectedTag) {
          const response = await updateTag({ ...values, id: selectedTag.id });
          return response;
        } else {
          const response = await createArea(values);
          return response;
        }
      })(),
      {
        loading: 'Guardando...',
        success: 'Guardado exitosamente',
        error: 'Error al guardar',
      }
    );
    handleCancel();
    router.refresh();
  };

  const handleCancel = () => {
    reset();
    if (mode === 'edit') {
      setSelectedTag(null);
      setMode('create');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 w-[300px]">
        <h2 className="text-xl font-bold mb-4">{mode === 'create' ? 'Crear Etiqueta' : 'Editar Etiqueta'}</h2>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Etiqueta</FormLabel>
              <FormControl>
                <Input type="text" {...field} placeholder="Nombre de la etiqueta" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input type="color" {...field} className="w-12 h-9 p-1 cursor-pointer" />
                  <Input
                    type="text"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder="#EF4444"
                    className="flex-1"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormLabel>Activo</FormLabel>
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit">{mode === 'create' ? 'Crear' : 'Actualizar'}</Button>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default TagForm;
