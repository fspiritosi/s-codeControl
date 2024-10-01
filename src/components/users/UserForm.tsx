'use client';

import { z } from 'zod';

import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useEditButton } from '@/store/editState';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const modulos = ['dashboard', 'empresa', 'empleados', 'equipos', 'documentacion', 'mantenimiento', 'ayuda'];

const UserFormSchema = z.object({
  fullname: z.string(),
  email: z.string(),
  modulos: z.array(z.string()),
});

function UserForm({ userData }: { userData: any }) {
  const readOnly = useEditButton((state) => state.readonly);

  const form = useForm<z.infer<typeof UserFormSchema>>({
    resolver: zodResolver(UserFormSchema),
    defaultValues: { fullname: userData.fullname, email: userData.email, modulos: userData.modulos || [] },
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
    event?.preventDefault();
    console.log('form.getValues():', form.getValues());
  };

  return (
    <Form {...form}>
      <form className="grid grid-cols-2 gap-x-4 gap-y-6" onSubmit={onsubmit}>
        <FormField
          control={form.control}
          name="fullname"
          disabled={readOnly}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre completo del usuario</FormLabel>
              <FormControl>
                <Input placeholder="usuario" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          disabled={readOnly}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mail del usuario</FormLabel>
              <FormControl>
                <Input placeholder="email" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
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
