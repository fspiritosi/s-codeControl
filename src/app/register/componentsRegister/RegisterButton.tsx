'use client'
import { Button } from '@/components/ui/button'
import { Loader2Icon } from 'lucide-react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { signup } from '../actions'

export const RegisterButton = () => {
  const { pending } = useFormStatus()

  let url = ''

  if (typeof window !== 'undefined') {
    url = window.location.origin
  }

  return (
    <Button
      className="w-[100%] sm:w-[80%] lg:w-[60%] self-center"
      formAction={formData => {
        toast.promise(
          async () => {
            console.log(url, 'url')
            signup(formData, url)
          },
          {
            loading: 'Registrando...',
            success: '¡Revisa tu correo para confirmar tu cuenta!',
            error: 'Hubo un error al registrarte',
          },
        )
      }}
      disabled={pending}
    >
      {pending ? <Loader2Icon className="animate-spin" /> : 'Registrarse'}
    </Button>
  )
}
