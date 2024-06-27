'use client';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuthData } from '@/hooks/useAuthData';
import { recoveryPassSchema } from '@/zodSchemas/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from './ui/button';
import { Input } from './ui/input';
export const RecoveryPasswordForm = () => {
  const { recoveryPassword } = useAuthData();
  const [showLoader, setShowLoader] = useState(false);

  const form = useForm<z.infer<typeof recoveryPassSchema>>({
    resolver: zodResolver(recoveryPassSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof recoveryPassSchema>) => {
    setShowLoader(true);

    toast.promise(
      async () => {
        await recoveryPassword(values.email);
      },
      {
        loading: 'Enviando...',
        success: (data) => {
          return 'Si existe una cuenta creada con ese email recibiras un correo con las instrucciones';
        },
        error: (error) => {
          return error;
        },
        finally: () => {
          setShowLoader(false);
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel className="text-lg">Email</FormLabel>
              <FormControl>
                <Input className="text-lg" placeholder="email@hotmail.com" {...field} />
              </FormControl>
              <FormDescription className="text-lg">Ingresa tu email para recuperar tu contraseña.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button disabled={showLoader} type="submit">
          Enviar
        </Button>
      </form>
    </Form>
  );
};
