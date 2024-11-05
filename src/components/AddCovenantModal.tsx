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
import { useLoggedUserStore } from '@/store/loggedUser';
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

export default function AddCovenantModal({
  guildInfo,
  fromEmployee = false,
}: {
  guildInfo: { name: string; id: string };
  fromEmployee?: boolean;
}) {
  const router = useRouter();

  //console.log(guildInfo, 'guildInfo');

  const company_id = useLoggedUserStore((state) => state.actualCompany?.id);
  const supabase = supabaseBrowser();
  const formSchema = z.object({
    name: z.string({ required_error: 'El nombre es requerido' }).min(2, {
      message: 'El nombre del convenio debe tener al menos 2 caracteres',
    }),
    company_id: z
      .string()
      .default(company_id || '')
      .optional(),
    guild_id: z.string().default(guildInfo?.id).optional(),
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      company_id: company_id || '',
      guild_id: guildInfo?.id,
    },
  });
  async function onSubmit({ name, company_id, guild_id }: z.infer<typeof formSchema>) {
    toast.promise(
      async () => {
        const { data, error } = await supabase
          .from('covenant')
          .insert([{ name: name, company_id, guild_id }] as any)
          .select();
        if (error) throw new Error(error.message);
        document.getElementById('close-covenant-modal')?.click();
        router.refresh();
        // return { data, error };
      },
      {
        loading: 'Creando convenio...',
        success: 'Convenio creado exitosamente',
        error: 'Ocurrio un error al crear el convenio',
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
            Nuevo convenio{' '}
          </Button>
        ) : (
          <Button variant={'outline'}>
            {' '}
            <Plus className="h-4 w-4" />
            Nuevo convenio{' '}
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Agregar nuevo convenio al sindicato <span className="font-bold">{guildInfo?.name}</span>
          </AlertDialogTitle>
          <AlertDialogDescription>
            Por favor complete los siguientes campos para agregar un nuevo Convenio.
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
                      <FormLabel>Convenio</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del convenio" {...field} />
                      </FormControl>
                      <FormDescription>Ingrese el nombre del convenio que desea agregar</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-4">
                  <AlertDialogCancel id="close-covenant-modal">Cancelar</AlertDialogCancel>
                  <Button type="submit">Crear convenio</Button>
                </div>
              </form>
            </Form>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
