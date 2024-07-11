'use client';
import { GoogleIcon } from '@/components/svg/google';
import { Button } from '@/components/ui/button';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { googleLogin } from '../actions';

function GoogleButton() {
  const { pending } = useFormStatus();

  let url = '';

  if (typeof window !== 'undefined') {
    url = window.location.origin;
  }

  return (
    <Button
      variant="outline"
      type="submit"
      className="w-[100%] sm:w-[80%] lg:w-[60%] self-center text-lg mb-7"
      disabled={pending}
      formAction={async () => {
        const error = await googleLogin(url);
        if (error) {
          toast.error('Error al iniciar sesión. Por favor, intenta de nuevo.');
        }
      }}
    >
      <span className="mr-2">
        {' '}
        <GoogleIcon />
      </span>{' '}
      {pending ? 'Cargando...' : 'Iniciar sesión con Google'}
    </Button>
  );
}

export default GoogleButton;
