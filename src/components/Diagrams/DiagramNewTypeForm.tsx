'use client';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import cookies from 'js-cookie';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Input } from '../ui/input';

export function DiagramNewTypeForm({ selectedDiagram }: { selectedDiagram?: any }) {
  const company_id = cookies.get('actualComp');
  const URL = process.env.NEXT_PUBLIC_BASE_URL;
  const NewDiagramType = z.object({
    name: z.string().min(1, { message: 'El nombre de la novedad no puede estar vacío' }),
    short_description: z.string().min(1, { message: 'La descripción dorta no puede estar vacía' }),
    color: z.string().min(1, { message: 'Por favor selecciona un color para la novedad' }),
  });

  type NewDiagramType = z.infer<typeof NewDiagramType>;

  const form = useForm<NewDiagramType>({
    resolver: zodResolver(NewDiagramType),
    defaultValues: {
      name: '',
      short_description: '',
      color: '',
    },
  });

  async function onSubmit(values: NewDiagramType) {
    // selectedDiagram
    // ?
    // console.log('aca llego',values)
    // :
    toast.promise(
      async () => {
        const data = JSON.stringify(values);
        const response = await fetch(`${URL}/api/employees/diagrams/tipos?actual=${company_id}`, {
          method: 'POST',
          body: data,
        });
        return response;
      },
      {
        loading: 'Cargando...',
        success: `Novedad ${values.name} cargada con exito`,
        error: 'No se pudo crear la novedad',
      }
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-[400px]">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la novedad</FormLabel>
              <Input placeholder="Ingresa un nombre para la novedad" {...field} value={selectedDiagram?.name} />
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
              <Input
                placeholder="Ingresa una descripción corta, ej: TD"
                {...field}
                value={selectedDiagram?.short_description}
              />
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
              <Input
                className=" max-w-20"
                placeholder="Elige un color"
                type="color"
                {...field}
                value={selectedDiagram?.color}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="mt-4" type="submit">
          Cargar novedad
        </Button>
      </form>
    </Form>
  );
}
