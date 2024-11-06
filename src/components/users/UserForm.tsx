'use client';

import { useRouter } from 'next/navigation';
import { z } from 'zod';

import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';

import { updateModulesSharedUser } from '@/app/server/UPDATE/actions';
import { useEditButton } from '@/store/editState';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';

const modulos = [
  'dashboard',
  'empresa',
  'empleados',
  'equipos',
  'operaciones',
  'documentación',
  'mantenimiento',
  'formularios',
  'ayuda',
];

const UserFormSchema = z.object({
  modulos: z.array(z.string()),
});

function UserForm({ userData }: { userData: any }) {
  const readOnly = useEditButton((state) => state.readonly);
  const router = useRouter();

  const form = useForm<z.infer<typeof UserFormSchema>>({
    resolver: zodResolver(UserFormSchema),
    defaultValues: {
      modulos: userData.modules || [],
    },
  });

  const handleCheckboxChange = (modulo: string) => {
    const modulos = form.getValues('modulos');
    if (modulos?.includes(modulo)) {
      const newValue = modulos.filter((item) => item !== modulo);
      form.setValue('modulos', newValue);
    } else {
      const newValue = [...modulos, modulo];
      form.setValue('modulos', newValue);
    }
  };
  const onsubmit = () => {
    toast.promise(
      async () => {
        const updateUser = await updateModulesSharedUser({
          id: userData.id,
          modules: form.getValues('modulos') as ModulosEnum[],
        });
      },
      {
        loading: 'Editando usurioa...',
        success: 'Usuario Editado correctamente!',
        error: 'Error al editar el usuario',
      }
    );
  };

  return (
    <Form {...form}>
      <form className="grid grid-cols-2 gap-x-4 gap-y-6" onSubmit={onsubmit}>
        <FormField
          control={form.control}
          name="modulos"
          render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel>Modulos</FormLabel>
              <FormControl>
                <div className="flex justify-between">
                  {modulos.map((modulo, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox
                        id={modulo}
                        disabled={readOnly}
                        checked={field.value?.includes(modulo)}
                        onCheckedChange={() => handleCheckboxChange(modulo)}
                      />
                      <Label htmlFor={modulo}>Modulo {modulo}</Label>
                    </div>
                  ))}
                </div>
              </FormControl>
            </FormItem>
          )}
        />
        <Button disabled={readOnly} type="submit">
          Guardar
        </Button>
      </form>
    </Form>
  );
}

export default UserForm;
