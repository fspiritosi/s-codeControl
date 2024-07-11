'use client';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuthData } from '@/hooks/useAuthData';
import { useProfileData } from '@/hooks/useProfileData';
import { LoggedUser } from '@/types/types';
import { registerSchema } from '@/zodSchemas/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthError } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { CloseEyeIcon } from './svg/closeEye';
import { Loader } from './svg/loader';
import { EyeIcon } from './svg/openEye';
import { Toggle } from './ui/toggle';

export function RegisterForm() {
  const { singUp } = useAuthData();
  const { insertProfile } = useProfileData();
  const [showPasswords, setShowPasswords] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const router = useRouter();

  // 1. Definir el form.
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstname: '',
      lastname: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // 2. Definir la función submit.
  const onSubmit = async (credentials: z.infer<typeof registerSchema>) => {
    setShowLoader(true);
    const { email, password, confirmPassword, ...rest } = credentials;
    try {
      const userData = (await singUp({ email, password })) as LoggedUser;

      await insertProfile({
        ...rest,
        credential_id: userData.user?.id || '',
        email,
        role: 'CodeControlClient',
      });
     
      router.push('/login');
    } catch (err: AuthError | any) {
     
    } finally {
      setShowLoader(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4">
      <Form {...form}>
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="firstname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Escribe tu nombre aquí" {...field} />
                </FormControl>
                <FormDescription>Por favor ingresa tu nombre.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellido</FormLabel>
                <FormControl>
                  <Input placeholder="Tu apellido" {...field} />
                </FormControl>
                <FormDescription>Por favor ingresa tu apellido.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo</FormLabel>
                <FormControl>
                  <Input placeholder="ejemplo@correo.com" autoComplete="email" {...field} />
                </FormControl>
                <FormDescription>Por favor ingresa tu correo.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      placeholder="Elige una contraseña segura"
                      type={showPasswords ? 'text' : 'password'}
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <Toggle onClick={() => setShowPasswords(!showPasswords)} variant={'outline'}>
                    {showPasswords ? <CloseEyeIcon /> : <EyeIcon />}
                  </Toggle>
                </div>
                <FormDescription>Por favor ingresa tu contraseña.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmar contraseña</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      placeholder="Repite tu contraseña"
                      type={showPasswords ? 'text' : 'password'}
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <Toggle onClick={() => setShowPasswords(!showPasswords)} variant={'outline'}>
                    {showPasswords ? <CloseEyeIcon /> : <EyeIcon />}
                  </Toggle>
                </div>
                <FormDescription>Por favor ingresa otra vez tu contraseña.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex w-full justify-center flex-col items-center gap-5">
            <Button className="w-[100%] sm:w-[80%] lg:w-[60%] self-center" type="submit" disabled={showLoader}>
              {showLoader ? <Loader /> : 'Ingresar'}
            </Button>
            <p className="text-[0.9rem]">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/login" className=" text-blue-400 ml-1">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </form>
      </Form>
    </div>
  );
}
