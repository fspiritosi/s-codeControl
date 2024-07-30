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
  import { useState } from 'react';
  import { ZodError, z } from 'zod';
  import { supabase } from '../../supabase/supabase';
  import { useToast } from './ui/use-toast';
  import { useLoggedUserStore } from '@/store/loggedUser';
  import { useEffect } from 'react';
  const schema = z
    .string()
    .min(3, {
      message: 'El nombre de la Asosiacion Gremial debe tener al menos 3 caracteres',
    })
    .max(100, {
      message: 'El nombre de la Asosiacion Gremial debe tener menos de 100 caracteres',
    });
  
  export default function AddGuildModal({
    children,
    fetchGuild,
    searchText,
  }: {
    children: React.ReactNode;
    fetchGuild: () => Promise<void>;
    searchText:string;
  }) {
    const [name, setName] = useState('');
    const { toast } = useToast();
    const company = useLoggedUserStore((state) => state.actualCompany?.id);
    useEffect(() => {
        setName(searchText);
      }, [searchText]);
    async function onSubmit() {
      try {
        schema.parse(name);
      } catch (error: ZodError | any) {
        toast({
          variant: 'destructive',
          title: 'Error al agregar la Asosiacion Gremial',
          description: error.errors[0].message,
        });
        return;
      }
  
      const { data, error } = await supabase
        .from('guild')
        .insert([{ name: name.slice(0, 1).toUpperCase() + name.slice(1), company_id: company  }])
        .select();
      if (error) {
        toast({
          title: 'Error al agregar la Asosiacion Gremial',
          description: error.message,
        });
        return;
      }
      toast({
        title: 'Asosiacion Gremial agregada',
        description: 'La Asosiacion Gremial ha sido agregada correctamente',
      });
      setName('');
      fetchGuild();
    }
  
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Agregar Asosiacion Gremial</AlertDialogTitle>
            <AlertDialogDescription>
              Por favor complete los siguientes campos para agregar una nueva Agregar Asosiacion Gremial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <div className="flex flex-col justify-center w-full space-y-5">
              <FormItem>
                <FormLabel>Nombre de la Agregar Asosiacion Gremial</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ingrese el Nombre de la Agregar Asosiacion Gremial"
                    value={name}

                    onChange={(e) => setName(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
              <div className="flex gap-2">
                <AlertDialogAction onClick={onSubmit}>Agregar Asosiacion Gremial</AlertDialogAction>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
              </div>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }
  