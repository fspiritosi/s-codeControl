'use client';
import { Button } from '@/components/ui/button';
import { loginSchema } from '@/zodSchemas/schemas';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { login } from '../actions';

export const LoginButton = () => {
  const { pending } = useFormStatus();

  const clientAccion = async (formData: FormData) => {
    const values = Object.fromEntries(formData.entries());
    const result = await loginSchema.safeParseAsync(values);

    Object.keys(values).forEach((key) => {
      const element = document.getElementById(`${key}_error`);
      if (element) {
        element.innerText = '';
      }
    });

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const element = document.getElementById(`${issue.path}_error`);
        if (element) {
          element.innerText = issue.message; //->mensaje de error
          element.style.color = 'red';
        }
      });

      Object.keys(values).forEach((key) => {
        if (!result.error.issues.some((issue) => issue.path.includes(key))) {
          const element = document.getElementById(`${key}_error`);
          if (element) {
            element.innerText = '';
          }
        }
      });
      return;
    }
    toast.promise(
      async () => {
        const error = await login(formData);

        if (error) {
          throw new Error(error);
        }
      },
      {
        loading: 'Iniciando Sesión...',
        success: '¡Bienvenido!',
        error: (error) => {
          return error;
        },
      }
    );
  };
  return (
    <Button
      className="w-[100%] sm:w-[80%] lg:w-[60%] self-center text-lg"
      formAction={(formData) => clientAccion(formData)}
      disabled={pending}
    >
      {pending ? 'Cargando...' : 'Iniciar Sesión'}
    </Button>
  );
};
