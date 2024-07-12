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
  import { ZodError, z } from 'zod';
  import { supabase } from '../../supabase/supabase';
  import { useToast } from './ui/use-toast';
  
  const schema = z
    .string()
    .min(1, {
      message: 'El nombre del convenio debe tener al menos 1 caracteres',
    })
    .max(100, {
      message: 'El nombre del convenio debe tener menos de 100 caracteres',
    });
  
  export default function AddCategoryModal({
    children,
    fetchCategory,
    covenantOptions,
    covenant_id
  }: {
    children: React.ReactNode;
    fetchCategory?: (covenant_id: string) => Promise<void>;
    covenantOptions?: { name: string; id: string }[];
    covenant_id?: string
  }) {
    const [name, setName] = useState('');
    // const [covenant, setCovenant] = useState('');
    const { toast } = useToast();
    
    async function onSubmit() {
      try {
        schema.parse(name);
      } catch (error: ZodError | any) {
        toast({
          variant: 'destructive',
          title: 'Error al agregar la categoria',
          description: error.errors[0].message,
        });
        return;
      }
      // const covenant_id = covenantOptions?.find((covenantOption) => covenantOption.name === covenant)?.id;
      console.log(covenant_id)
      const { data, error } = await supabase
        .from('category')
        .insert([
          {
            name: name.slice(0, 1).toUpperCase() + name.slice(1),
            covenant_id: covenant_id,
          },
        ])
        .select();
      if (error) {
        toast({
          title: 'Error al agregar la categoria',
          description: error.message,
        });
        return;
      }
      toast({
        title: 'la categoria agregada correctamente',
        description: 'la categoria ha sido agregada correctamente',
      });
      if (fetchCategory) {
        fetchCategory(covenant_id || '');
      }
    }
  
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Agregar una nueva categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Por favor complete los siguientes campos para agregar una nueva categoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <div className="flex flex-col justify-center w-full space-y-5">
              <FormItem>
                <FormLabel>Nombre de la categoria</FormLabel>
                <Input
                  placeholder="Ingrese el nombre de la categoria"
                  onChange={(e) => setName(e.target.value)}
                  value={name}
                />
              </FormItem>
              {/* <FormItem>
                <FormLabel>Seleccione el convenio al que pertenece la categoria</FormLabel>
                <Select onValueChange={(value) => setCovenant(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Categorias registradas</SelectLabel>
                      {covenantOptions?.map((option) => (
                        <SelectItem key={option.id} value={option.name}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FormItem> */}
              <div className="flex gap-2">
                <AlertDialogAction onClick={onSubmit}>Agregar Categoria</AlertDialogAction>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
              </div>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }
  