'use client';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { useAuthData } from '@/hooks/useAuthData';
import { loginSchema } from '@/zodSchemas/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { EyeClosedIcon, EyeOpenIcon } from '@radix-ui/react-icons';
import { AuthError } from '@supabase/supabase-js';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { GoogleIcon } from './svg/google';
import { Loader } from './svg/loader';
import { Separator } from './ui/separator';

export function LoginForm() {
  const { login, googleLogin } = useAuthData();
  const [showPassword, setShowPassword] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const error = hashParams.get('error');
      if (error) {
        toast.error('Error al iniciar sesión');
      }
    }
  }, []);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { theme } = useTheme();

  const onSubmit = async (credentials: z.infer<typeof loginSchema>) => {
    try {
      setShowLoader(true);
      await login(credentials);
      router.push('/dashboard');
    } catch (error: AuthError | any) {
      toast.error(error.message);
    } finally {
      setShowLoader(false);
    }
  };

  const loginGooglePrivider = async () => {
    try {
      const user = await googleLogin();
      return user;
    } catch (error: AuthError | any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="flex flex-col">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="m-2">Email</FormLabel>
                  <FormControl>
                    <Input placeholder="ejemplo@correo.com" autoComplete="email" {...field} />
                  </FormControl>
                  <FormDescription>Por favor ingresa tu correo.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="m-2">Contraseña</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="mi contraseña segura"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <Toggle onClick={() => setShowPassword(!showPassword)} variant={'outline'}>
                    {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                  </Toggle>
                </div>
                <div className="flex justify-between">
                  <FormDescription>Por favor ingresa tu contraseña.</FormDescription>
                  <Link href="/reset_password" className="text-blue-400 text-[0.8rem]">
                    Olvidaste tu contraseña?
                  </Link>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex w-full justify-center flex-col items-center gap-5">
            <Button
              className="w-[100%] sm:w-[80%] lg:w-[60%] self-center"
              type="submit"
              disabled={showLoader}
              variant="default"
            >
              {showLoader ? <Loader /> : 'Iniciar sesión'}
            </Button>
            <Link href="/register" className="text-[0.8rem] ">
              ¿No tienes una cuenta? <span className="text-blue-400 ml-1">Créate una aquí</span>
            </Link>
          </div>
        </form>
      </Form>
      <Separator orientation="horizontal" className="my-6 w-[70%] self-center" />
      <Button
        variant="outline"
        className="w-[100%] sm:w-[80%] lg:w-[60%] self-center mb-7"
        onClick={loginGooglePrivider}
      >
        <span className="mr-2">
          {' '}
          <GoogleIcon />
        </span>{' '}
        Inicia sesión con Google
      </Button>
    </div>
  );
}
