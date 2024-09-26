import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { ZodError, z } from 'zod';
import { supabase } from '../../supabase/supabase';

const schema = z
  .string()
  .min(3, {
    message: 'El nombre de la marca debe tener al menos 3 caracteres',
  })
  .max(15, {
    message: 'El nombre de la marca debe tener menos de 15 caracteres',
  });

export default function AddBrandModal({
  children,
  fetchData,
}: {
  children: React.ReactNode;
  fetchData: () => Promise<void>;
}) {
  const [name, setName] = useState('');
  const router = useRouter();

  async function onSubmit() {
    try {
      schema.parse(name);
    } catch (error: ZodError | any) {
      toast.error('Error al agregar la marca', { description: error.errors[0].message });
      return;
    }

    const { data, error } = await supabase
      .from('brand_vehicles')
      .insert([{ name: name.slice(0, 1)?.toUpperCase() + name.slice(1) }])
      .select();
    if (error) {
      toast('Error al agregar la marca', { description: error.message });
      return;
    }
    toast('Marca agregada', { description: 'La marca ha sido agregada correctamente' });
    setName('');
    fetchData();
    router.refresh();
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Agregar una nueva marca</AlertDialogTitle>
          <AlertDialogDescription>
            Por favor complete los siguientes campos para agregar una nueva marca de vehículo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <div className="flex flex-col justify-center w-full space-y-5">
            <FormItem>
              <FormLabel>Nombre de la marca</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ingrese el nombre de la marca"
                  onChange={(e) => setName(e.target.value)}
                  value={name}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            <div className="flex gap-2">
              <AlertDialogAction onClick={onSubmit}>Agregar marca</AlertDialogAction>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
            </div>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
