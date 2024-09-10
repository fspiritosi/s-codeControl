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
import { cn } from '@/lib/utils';
import { useLoggedUserStore } from '@/store/loggedUser';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from './ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { FormEvent } from 'react';

export default function AddGuildModal({ fromEmployee: fromEmployee = false }) {
  const company_id = useLoggedUserStore((state) => state.actualCompany?.id);
  const supabase = supabaseBrowser();
  const router = useRouter();
  const formSchema = z.object({
    name: z.string({ required_error: 'El nombre es requerido' }).min(2, {
      message: 'El nombre de la Asosiacion Gremial debe tener al menos 2 caracteres',
    }),
    company_id: z
      .string()
      .default(company_id || '')
      .optional(),
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      company_id: company_id || '',
    },
  });
  async function onSubmit({ name, company_id }: z.infer<typeof formSchema>) {
    toast.promise(
      async () => {
        const { data, error } = await supabase
          .from('guild')
          .insert([{ name: name.slice(0, 1).toUpperCase() + name.slice(1), company_id }])
          .select();
        if (error) throw new Error(error.message);
        document.getElementById('close-guild-modal')?.click();
        router.refresh();

        // return { data, error };
      },
      {
        loading: 'Creando sindicato...',
        success: 'Sindicato creado exitosamente',
        error: 'Ocurrio un error al crear el sindicato',
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
        <Button className={cn(fromEmployee && 'w-full')}>
          <Plus className="h-4 w-4" />
          Nuevo sindicato
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Agregar Asosiacion Gremial</AlertDialogTitle>
          <AlertDialogDescription>
            Por favor complete los siguientes campos para agregar una nueva Agregar Asosiacion Gremial.
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
                      <FormLabel>Sindicato</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del sindicato" {...field} />
                      </FormControl>
                      <FormDescription>Ingrese el nombre del sindicato que desea agregar</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-4">
                  <AlertDialogCancel id="close-guild-modal">Cancelar</AlertDialogCancel>
                  <Button type="submit">Crear sindicato</Button>
                </div>
              </form>
            </Form>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
