'use client';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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
    id: z.string().optional(),
  });
  const [buttonToShow, setButtonToShow] = useState(true);
  const [diagramToEdit, setDiagramToEdit] = useState(false);
  type NewDiagramType = z.infer<typeof NewDiagramType>;
  const router = useRouter();

  const form = useForm<NewDiagramType>({
    resolver: zodResolver(NewDiagramType),
    defaultValues: {
      name: '',
      short_description: '',
      color: '',
      id: '',
    },
  });

  async function onSubmit(values: NewDiagramType) {
    const method = diagramToEdit ? 'PUT' : 'POST';
    const url = diagramToEdit
      ? `${URL}/api/employees/diagrams/tipos`
      : `${URL}/api/employees/diagrams/tipos?actual=${company_id}`;

    toast.promise(
      async () => {
        const data = JSON.stringify(values);
        const response = await fetch(url, {
          method,
          body: data,
        });
        return response;
      },
      {
        loading: 'Cargando...',
        success: selectedDiagram
          ? `Novedad ${values.name} editada con éxito`
          : `Novedad ${values.name} cargada con éxito`,
        error: selectedDiagram ? 'No se pudo editar la novedad' : 'No se pudo crear la novedad',
      }
    );

    cleanForm();
    router.refresh();
  }

  function cleanForm() {
    form.reset({
      name: '',
      short_description: '',
      color: '',
      id: '',
    });
    setDiagramToEdit(!diagramToEdit);
    setButtonToShow(!buttonToShow);
  }

  useEffect(() => {
    console.log(selectedDiagram);
    form.reset({
      name: selectedDiagram ? selectedDiagram?.name : '',
      short_description: selectedDiagram ? selectedDiagram?.short_description : '',
      color: selectedDiagram ? selectedDiagram?.color : '',
      id: selectedDiagram ? selectedDiagram?.id : '',
    });
    setDiagramToEdit(!diagramToEdit);
    setButtonToShow(!buttonToShow);
  }, [selectedDiagram]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-[400px]">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la novedad</FormLabel>
              <Input placeholder="Ingresa un nombre para la novedad" {...field} />
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
              <Input placeholder="Ingresa una descripción corta, ej: TD" {...field} />
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
              <Input className=" max-w-20" placeholder="Elige un color" type="color" {...field} />
              <FormMessage />
            </FormItem>
          )}
        />
        {buttonToShow && !diagramToEdit ? (
          <Button className="mt-4" type="submit">
            Cargar novedad
          </Button>
        ) : (
          <div className="flex gap-x-4">
            <Button className="mt-4" type="submit">
              Editar Novedad
            </Button>
            <Button className="mt-4" type="button" onClick={() => cleanForm()}>
              Limpiar formulario
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}

// Si tengo un boton que dice "Editar" necesito tener un boton que diga "Limpiar formulario", para que el usuario pueda limpiar el formulario y cargar uno nuevo

//si selectedDiagram tiene algo, se debe cargar el formulario con los valores de selectedDiagram
//si selectedDiagram no tiene nada, se debe cargar el formulario vacio
//si selectedDiagram tiene algo, se debe hacer un fetch de tipo PUT en vez de POST
//si selectedDiagram tiene algo, el toast de success debe decir que se edito con exito
//si selectedDiagram tiene algo, el toast de error debe decir que no se pudo editar
