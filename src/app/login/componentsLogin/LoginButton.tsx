'use client'
import { Button } from '@/components/ui/button'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { login } from '../actions'

export const LoginButton = () => {
  const { pending } = useFormStatus()
  return (
    <Button
      className="w-[100%] sm:w-[80%] lg:w-[60%] self-center"
      formAction={formData => {
        toast.promise(
          async () => {
            const error = await login(formData)
            if (error) {
              if (error === 'Invalid login credentials') {
                return 'Correo o contraseña inválidos.'
              }
              throw new Error('Hubo un error al iniciar sesión')
            }
          },
          {
            loading: 'Iniciando Sesión...',
            success: '¡Bienvenido!',
            error: error => {
              return error
            },
          },
        )
      }}
      disabled={pending}
    >
      {pending ? 'Cargando...' : 'Iniciar Sesión'}
    </Button>
  )
}
