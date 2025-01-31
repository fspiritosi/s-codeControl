'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { handleSupabaseError } from '@/lib/errorHandler';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { validarCUIL } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import cookies from 'js-cookie';
import { ArrowLeft, Clipboard } from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

export default function CodeControlLogin() {
  const [step, setStep] = useState('selection');
  const [loginType, setLoginType] = useState<'empleado' | 'invitado' | ''>('');
  const supabase = supabaseBrowser();
  const searchParams = useSearchParams();
  const equipment_id = searchParams.get('equipment');
  const router = useRouter();

  const formSchema = z.object({
    email:
      loginType === 'invitado'
        ? z
            .string({
              required_error: 'El correo electrónico es requerido.',
            })
            .email({
              message: 'El correo electrónico es inválido.',
            })
        : z.string().optional(),
    password:
      loginType === 'invitado'
        ? z
            .string({
              required_error: 'La contraseña es requerida.',
            })
            .min(6, {
              message: 'La contraseña debe tener al menos 6 caracteres.',
            })
        : z.string().optional(),
    cuil:
      loginType === 'empleado'
        ? z
            .string({
              required_error: 'El CUIL es requerido.',
            })
            .refine(
              (cuil) => {
                return validarCUIL(cuil);
              },
              { message: 'El CUIL es inválido' }
            )
        : z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      cuil: '',
    },
  });

  useEffect(() => {
    supabase.auth.signOut();
    cookies.remove('empleado_id');
    cookies.remove('empleado_name');
  }, []);

  async function onSubmit({ cuil, email, password }: z.infer<typeof formSchema>) {
    toast.promise(
      async () => {
        if (!equipment_id) {
          throw new Error('No se ha seleccionado un equipo. Por favor, intente escanear el código QR nuevamente.');
        }
        if (loginType === 'invitado' && email && password) {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) {
            throw new Error(handleSupabaseError(error.message));
          }
          router.push(`/maintenance/${equipment_id}`);
        } else {
          const { data, error } = await supabase
            .from('employees')
            .select()
            .eq('cuil', cuil || '');

          // console.log(data, error);

          if (data && data.length > 0) {
            const empleado = data[0];
            //Setear una cookie con el id del empleado que se borre en 1 hora
            cookies.set('empleado_id', empleado.id, { expires: 1 / 24 });
            cookies.set('empleado_name', `${empleado.firstname} ${empleado.lastname}`, { expires: 1 / 24 });
            router.push(`/maintenance/${equipment_id}`);
          } else {
            throw new Error('Empleado no encontrado.');
          }
        }
      },
      {
        loading: 'Iniciando sesión...',
        success: 'Sesión iniciada correctamente.',
        error: (error) => error,
      }
    );
  }

  const handleSelection = (type: 'empleado' | 'invitado') => {
    setLoginType(type);
    setStep('login');
  };
  const handleBack = () => {
    setStep('selection');
    setLoginType('');
    form.reset();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white  bg-cover bg-center p-4 ">
      <Card className="w-full max-w-md shadow-lg h-full">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Image src="/logoLetrasNegras.png" alt="CodeControl Logo" width={240} height={60} className="h-15" />
          </div>
          <CardDescription className="text-center text-gray-600">
            Sistema de Checklist y Mantenimiento de Equipos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'selection' ? (
            <div className="space-y-4">
              <p className="text-center text-gray-700 mb-4">Seleccione su tipo de usuario para continuar:</p>
              <Button
                className="w-full bg-[#3BB3E3] hover:bg-[#2A9AC7] text-white"
                onClick={() => handleSelection('empleado')}
              >
                Empleado
              </Button>
              <Button
                className="w-full bg-gray-600 hover:bg-gray-700 text-white"
                onClick={() => handleSelection('invitado')}
              >
                Invitado
              </Button>
              <Button
                className="w-full bg-gray-600 hover:bg-gray-700 text-white"
                onClick={() => handleSelection('invitado')}
              >
                Mecanico
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <CardDescription className="text-center text-gray-700 mb-4">
                  {loginType === 'empleado'
                    ? 'Ingrese su CUIL para acceder al sistema de mantenimiento.'
                    : 'Ingrese sus credenciales para acceder al sistema de mantenimiento.'}
                </CardDescription>
                {loginType === 'empleado' ? (
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="cuil"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cuil</FormLabel>
                          <FormControl>
                            <Input placeholder="Ingrese su Cuil" {...field} />
                          </FormControl>
                          {/* <FormDescription>This is your public display name.</FormDescription> */}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ) : (
                  <>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Ingrese su correo" {...field} />
                          </FormControl>
                          {/* <FormDescription>This is your public display name.</FormDescription> */}
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
                          <FormControl>
                            <Input type="password" placeholder="Ingrese su contraseña" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                <Button type="submit" className="w-full bg-[#3BB3E3] hover:bg-[#2A9AC7] text-white">
                  <Clipboard className="mr-2 h-4 w-4" /> Acceder al Sistema
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        {step === 'login' && (
          <CardFooter>
            <Button
              variant="outline"
              className="w-full border-[#3BB3E3] text-[#3BB3E3] hover:bg-[#E6F7FF]"
              onClick={handleBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Regresar
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
