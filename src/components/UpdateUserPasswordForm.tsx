'use client';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuthData } from '@/hooks/useAuthData';
import { changePassSchema } from '@/zodSchemas/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { CloseEyeIcon } from './svg/closeEye';
import { EyeIcon } from './svg/openEye';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Toggle } from './ui/toggle';

export const UpdateUserPasswordForm = () => {
  const { updateUser } = useAuthData();
  const [showPassword, setShowPassword] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof changePassSchema>>({
    resolver: zodResolver(changePassSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof changePassSchema>) => {
    setShowLoader(true);

    toast.promise(
      async () => {
        await updateUser(values);
      },
      {
        loading: 'Actualizada contraseña...',
        success: (data) => {
          return 'Tu contraseña ha sido cambiada con éxito. Ya puedes iniciar sesión con tu nueva contraseña.';
        },
        error: (error) => {
          return error;
        },
        finally: () => {
          setShowLoader(false);
          router.push('/login');
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg">Contraseña</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="contraseña segura"
                    autoComplete="new-password"
                    className="text-lg"
                    {...field}
                  />
                </FormControl>
                <Toggle onClick={() => setShowPassword(!showPassword)} variant={'outline'}>
                  {showPassword ? <CloseEyeIcon /> : <EyeIcon />}
                </Toggle>
              </div>
              <FormDescription className="text-lg">Ingresa tu nueva contraseña.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg">Confirmar contraseña</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="contraseña segura"
                    autoComplete="new-password"
                    className="text-lg"
                    {...field}
                  />
                </FormControl>
                <Toggle onClick={() => setShowPassword(!showPassword)} variant={'outline'}>
                  {showPassword ? <CloseEyeIcon /> : <EyeIcon />}
                </Toggle>
              </div>
              <FormDescription className="text-lg">Ingresa tu nueva contraseña otra vez.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={showLoader}>
          Cambiar contraseña
        </Button>
      </form>
    </Form>
  );
};
