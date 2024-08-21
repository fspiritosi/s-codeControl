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
import { useRouter } from 'next/navigation';
  const schema = z
    .string()
    .min(3, {
      message: 'El nombre del convenio debe tener al menos 3 caracteres',
    })
    .max(30, {
      message: 'El nombre del convenio debe tener menos de 30 caracteres',
    });
  
  export default function AddCovenantModal({
    children,
    fetchData,
    guildId,
    searchText,
  }: {
    children: React.ReactNode;
    fetchData: (name: string) => Promise<void>;
    guildId: {name:string;id:string};
    searchText:string;
  }) {
    const router = useRouter()
    const [name, setName] = useState('');
    const { toast } = useToast();
    const company = useLoggedUserStore((state) => state.actualCompany?.id);
    
    useEffect(() => {
      setName(searchText);
    }, [searchText]);
    async function onSubmit() {
      try {
        // schema.parse(name);
      } catch (error: ZodError | any) {
        toast({
          variant: 'destructive',
          title: 'Error al agregar el convenio',
          description: error.errors[0].message,
        });
        return;
      }
      

      const { data, error } = await supabase
        .from('covenant')
        .insert([{ name:name, company_id: company, guild_id: guildId.id  }])
        .select();
      if (error) {
        toast({
          title: 'Error al agregar el convenio',
          description: error.message,
        });
        return;
      }
      toast({
        title: 'Convenio agregado',
        description: 'El convenio ha sido agregado correctamente',
      });
      setName('');
      fetchData(guildId.id);
      router.refresh()
    }
  
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Agregar un nuevo convenio</AlertDialogTitle>
            <AlertDialogDescription>
              Por favor complete los siguientes campos para agregar un nuevo convenio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <div className="flex flex-col justify-center w-full space-y-5">
              <FormItem>
                <FormLabel>Nombre y número del convenio</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ingrese el número de convenio"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
              <div className="flex gap-2">
                <AlertDialogAction onClick={onSubmit}>Agregar Convenio</AlertDialogAction>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
              </div>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }
  