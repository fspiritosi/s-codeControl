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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { handleSupabaseError } from '@/lib/errorHandler';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusCircledIcon } from '@radix-ui/react-icons';
import { useRouter } from 'next/navigation';
import { FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button, buttonVariants } from './ui/button';

export default function AddTypeModal({ company_id, value }: { company_id: string; value: string }) {
  const formSchema = z.object({
    name: z.string().min(2, {
      message: 'El nombre debe tener al menos 2 caracteres.',
    }),
    company_id: z.string().default(company_id),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company_id,
    },
  });

  const supabase = supabaseBrowser();
  const router = useRouter();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    //console.log(values);

    const { data, error } = await supabase
      .from('type')
      .insert({
        name: values.name ?? value,
        company_id: values.company_id,
      })
      .select();

    if (error) {
      throw new Error(handleSupabaseError(error.message));
    }
    // console.log('data', data);
    router.refresh();
  }
  const handleNestedFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    toast.promise(onSubmit(form.getValues()), {
      loading: 'Creando tipo de vehículo...',
      success: 'Tipo de vehículo creado exitosamente',
      error: (error) => error,
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className="m-0 w-full" variant={'outline'}>
          <PlusCircledIcon className="mr-2" />
          Agregar tipo
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Agregar nuevo tipo de vehículo</AlertDialogTitle>
          <AlertDialogDescription>
            <Form {...form}>
              <form onSubmit={handleNestedFormSubmit} className="space-y-8">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del tipo de vehiculo</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre" defaultValue={value} {...field} />
                      </FormControl>
                      <FormDescription>Ingrese el nombre del tipo de vehículo que desea agregar.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-between">
                  <AlertDialogCancel className={buttonVariants({ variant: 'destructive' })}>Cancelar</AlertDialogCancel>
                  <Button type="submit">Crear</Button>
                </div>
              </form>
            </Form>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
