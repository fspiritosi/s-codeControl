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
import { FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { toast } from 'sonner';
import { ZodError, z } from 'zod';
import { supabase } from '../../supabase/supabase';
import { generic } from './VehiclesForm';

const schema = z
  .string()
  .min(1, {
    message: 'El nombre de la marca debe tener al menos 1 caracteres',
  })
  .max(100, {
    message: 'El nombre de la marca debe tener menos de 100 caracteres',
  });

export default function AddModelModal({
  children,
  fetchModels,
  brandOptions,
}: {
  children: React.ReactNode;
  fetchModels?: (brand_id: string) => Promise<void>;
  brandOptions?: VehicleBrand[] | null;
}) {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');

  async function onSubmit() {
    try {
      schema.parse(name);
    } catch (error: ZodError | any) {
      toast('Error al agregar el modelo', {
        description: error.errors[0].message,
      });
      return;
    }
    const brand_id = brandOptions?.find((brandOption) => brandOption.name === brand)?.id;

    const { data, error } = await supabase
      .from('model_vehicles')
      .insert([
        {
          name: name.slice(0, 1)?.toUpperCase() + name.slice(1),
          brand: brand_id,
        },
      ])
      .select();
    if (error) {
      toast('Error al agregar el modelo', {
        description: error.message,
      });
      return;
    }
    toast('Modelo agregado correctamente', { description: 'El modelo ha sido agregado correctamente' });
    if (fetchModels) {
      fetchModels(`${brand_id}`);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Agregar un nuevo modelo de un vehículo</AlertDialogTitle>
          <AlertDialogDescription>
            Por favor complete los siguientes campos para agregar un nuevo modelo de vehículo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <div className="flex flex-col justify-center w-full space-y-5">
            <FormItem>
              <FormLabel>Nombre del modelo</FormLabel>
              <Input
                placeholder="Ingrese el nombre del modelo"
                onChange={(e) => setName(e.target.value)}
                value={name}
              />
            </FormItem>
            <FormItem>
              <FormLabel>Seleccione la marca a la que pertenece el modelo</FormLabel>
              <Select onValueChange={(value) => setBrand(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una marca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Marcas registradas</SelectLabel>
                    {brandOptions?.map((option) => (
                      <SelectItem key={option.id} value={option.name || ''}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </FormItem>
            <div className="flex gap-2">
              <AlertDialogAction onClick={onSubmit}>Agregar modelo</AlertDialogAction>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
            </div>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
