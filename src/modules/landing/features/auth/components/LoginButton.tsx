'use client';
import { Button } from '@/shared/components/ui/button';
import { loginSchema } from '@/shared/zodSchemas/schemas';
import { useState } from 'react';
import { toast } from 'sonner';
import { login } from '@/modules/landing/features/auth/actions/login.actions';
import { useRouter } from 'next/navigation';

export const LoginButton = () => {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const setFieldError = (field: string, message: string) => {
    const el = document.getElementById(`${field}_error`);
    if (el) {
      el.innerText = message;
      el.style.color = message ? 'red' : '';
    }
  };

  const clearErrors = (fields: string[]) => {
    fields.forEach((field) => setFieldError(field, ''));
  };

  const handleLogin = async (formData: FormData) => {
    const values = Object.fromEntries(formData.entries());
    const fields = Object.keys(values);
    const result = await loginSchema.safeParseAsync(values);

    clearErrors(fields);

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        setFieldError(issue.path[0] as string, issue.message);
      });
      return;
    }

    setPending(true);

    toast.promise(
      async () => {
        const error = await login(formData);
        if (error) throw new Error(error);
        router.push('/dashboard');
      },
      {
        loading: 'Iniciando Sesión...',
        success: '¡Bienvenido!',
        error: (error) => error?.message || 'Error al iniciar sesión',
        finally: () => setPending(false),
      }
    );
  };

  return (
    <Button
      className="w-[100%] sm:w-[80%] lg:w-[60%] self-center text-lg"
      formAction={handleLogin}
      disabled={pending}
    >
      {pending ? 'Cargando...' : 'Iniciar Sesión'}
    </Button>
  );
};
