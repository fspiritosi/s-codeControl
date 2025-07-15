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
import { createDocType, updateDocType, fetchAllHseDocTypes} from '../actions/documents';

const tagSchema = z.object({
  name: z.string().nonempty({ message: 'El nombre es requerido' }),
  short_description: z.string().nonempty({ message: 'La descripción corta es requerida' }),
  is_active: z.boolean().default(true),
});



interface DocTypeFormProps {
  mode: 'create' | 'edit';
  setMode: (mode: 'create' | 'edit') => void;
  selectedDocType: Awaited<ReturnType<typeof fetchAllHseDocTypes>>[] | null;
  setSelectedDocType: (docType: Awaited<ReturnType<typeof fetchAllHseDocTypes>>[] | null) => void;
}

type DocTypeFormValues = z.infer<typeof tagSchema>;

function DocTypeForm({ mode, setMode, selectedDocType, setSelectedDocType }: DocTypeFormProps) {
  const form = useForm<DocTypeFormValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: '',
      short_description: '',
      is_active: true,
    },
  });

  const { reset } = form;
  const router = useRouter();

  // Cargar datos cuando cambia el modo o el área seleccionada
  useEffect(() => {
    if (mode === 'edit' && selectedDocType) {
      reset({
        name: selectedDocType.name,
        short_description: selectedDocType.short_description,
        is_active: selectedDocType.is_active,
      });
    } else if (mode === 'create') {
      reset({
        name: '',
        short_description: '',
        is_active: true,
      });
    }
  }, [mode, selectedDocType, reset]);

  const handleSubmit = async (values: DocTypeFormValues) => {
    toast.promise(
      (async () => {
        if (mode === 'edit' && selectedDocType) {
          const response = await updateDocType({ ...values, id: selectedDocType.id });
          return response;
        } else {
          const response = await createDocType(values);
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
      setSelectedDocType(null);
      setMode('create');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 w-[300px]">
        <h2 className="text-xl font-bold mb-4">{mode === 'create' ? 'Crear Tipo de Documentos' : 'Editar Tipo de Documentos'}</h2>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Documento</FormLabel>
              <FormControl>
                <Input type="text" {...field} placeholder="Nombre del documento" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}    
          name="short_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción corta</FormLabel>
              <FormControl>
                <Input type="text" {...field} placeholder="Descripción corta" />
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

export default DocTypeForm;
