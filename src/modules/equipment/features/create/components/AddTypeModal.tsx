import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { handleSupabaseError } from '@/shared/lib/errorHandler';
import { insertTypeVehicle } from '@/modules/equipment/features/create/actions.server';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusCircledIcon } from '@radix-ui/react-icons';
import { useRouter } from 'next/navigation';
import { FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button, buttonVariants } from '@/shared/components/ui/button';

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

  const router = useRouter();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const { error } = await insertTypeVehicle(values.name ?? value, values.company_id);

    if (error) {
      throw new Error(handleSupabaseError(error));
    }
    router.refresh();
  }
  const handleNestedFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    toast.promise(onSubmit(form.getValues()), {
      loading: 'Creando tipo de vehiculo...',
      success: 'Tipo de vehiculo creado exitosamente',
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
          <AlertDialogTitle>Agregar nuevo tipo de vehiculo</AlertDialogTitle>
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
                      <FormDescription>Ingrese el nombre del tipo de vehiculo que desea agregar.</FormDescription>
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
