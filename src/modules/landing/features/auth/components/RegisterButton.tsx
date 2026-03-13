'use client';
import { Button } from '@/shared/components/ui/button';
import { registerSchema } from '@/shared/zodSchemas/schemas';
import { Loader2Icon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { signup } from '@/modules/landing/features/auth/actions/register.actions';

export const RegisterButton = () => {
  const { pending } = useFormStatus();
  const router = useRouter();

  let url = '';

  if (typeof window !== 'undefined') {
    url = window.location.origin
  }

  const clientAccion = async (formData: FormData) => {
    const values = Object.fromEntries(formData.entries())
    const result = registerSchema.safeParse(values)

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
        const error = await signup(formData, url);
        if (error) {
          throw new Error(error);
        }
      },
      {
        loading: 'Registrando...',
        success: () => {
          router.push('/login');
          return '¡Registro exitoso!';
        },
        error: (error) => {
          return error instanceof Error ? error.message : String(error);
        },
      }
    );
  };

  return (
    <Button
      className="w-[100%] sm:w-[80%] lg:w-[60%] self-center text-lg"
      formAction={(e) => {
        clientAccion(e);
      }}
      disabled={pending}
    >
      {pending ? <Loader2Icon className="animate-spin" /> : 'Registrarse'}
    </Button>
  );
};
