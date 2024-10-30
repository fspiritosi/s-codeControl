import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from './ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';

export default function AddCategoryModal({
  covenantInfo,
  fromEmployee,
}: {
  covenantInfo: { name: string; id: string };
  fromEmployee?: boolean;
}) {
  const router = useRouter();

  const supabase = supabaseBrowser();
  const formSchema = z.object({
    name: z.string({ required_error: 'El nombre es requerido' }).min(2, {
      message: 'El nombre de la categoria debe tener al menos 2 caracteres',
    }),
    covenant_id: z
      .string()
      .default(covenantInfo?.id || '')
      .optional(),
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      covenant_id: covenantInfo?.id,
    },
  });
  async function onSubmit({ name, covenant_id }: z.infer<typeof formSchema>) {
    toast.promise(
      async () => {
        const { data, error } = await supabase
          .from('category')
          .insert([
            {
              name: name.slice(0, 1).toUpperCase() + name.slice(1),
              covenant_id,
            },
          ])
          .select();
        if (error) throw new Error(error.message);
        document.getElementById('close-category-modal')?.click();
        router.refresh();
      },
      {
        loading: 'Creando categoria...',
        success: 'Categoria creada exitosamente',
        error: 'Ocurrio un error al crear la categoria',
      }
    );
  }
  const handleNestedFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    form.handleSubmit(onSubmit)(event);
  };
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {fromEmployee ? (
          <Button className="w-full">
            {' '}
            <Plus className="h-4 w-4" />
            Nueva categoria
          </Button>
        ) : (
          <Button variant={'link'}>
            {' '}
            <Plus className="h-4 w-4" />
            Nueva categoria
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Agregar categoria al convenio <span className="font-bold">{covenantInfo?.name}</span>
          </AlertDialogTitle>
          <AlertDialogDescription>
            Por favor complete los siguientes campos para agregar una nueva categoria.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <div className="flex flex-col justify-center w-full">
            <Form {...form}>
              <form onSubmit={handleNestedFormSubmit} className="space-y-8">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre de la categoria" {...field} />
                      </FormControl>
                      <FormDescription>Ingrese el nombre de la categoria que desea agregar</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-4">
                  <AlertDialogCancel id="close-category-modal">Cancelar</AlertDialogCancel>
                  <Button type="submit">Crear categoria</Button>
                </div>
              </form>
            </Form>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
