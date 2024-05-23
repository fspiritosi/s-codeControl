'use client'
import { Button } from '@/components/ui/button'
import { registerSchema } from '@/zodSchemas/schemas'
import { Loader2Icon } from 'lucide-react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { signup } from '../actions'

export const RegisterButton = () => {
  const { pending } = useFormStatus()

  let url = ''

  if (typeof window !== 'undefined') {
    url = window.location.origin
    console.log(url, 'url email')
  }

  const clientAccion = async (formData: FormData) => {
    const values = Object.fromEntries(formData.entries())
    const result = registerSchema.safeParse(values)
    console.log(result, 'result')

    Object.keys(values).forEach(key => {
      const element = document.getElementById(`${key}_error`)
      if (element) {
        element.innerText = ''
      }
    })

    if (!result.success) {
      result.error.issues.forEach(issue => {
        const element = document.getElementById(`${issue.path}_error`)
        if (element) {
          element.innerText = issue.message //->mensaje de error
          element.style.color = 'red'
        }
      })

      Object.keys(values).forEach(key => {
        if (!result.error.issues.some(issue => issue.path.includes(key))) {
          const element = document.getElementById(`${key}_error`)
          if (element) {
            element.innerText = ''
          }
        }
      })
      return
    }

    toast.promise(
      async () => {
        signup(formData, url)
      },
      {
        loading: 'Registrando...',
        success: '¡Revisa tu correo para confirmar tu cuenta!',
        error: 'Hubo un error al registrarte',
      },
    )
  }

  return (
    <Button
      className="w-[100%] sm:w-[80%] lg:w-[60%] self-center"
      formAction={e => {
        clientAccion(e)
      }}
      disabled={pending}
    >
      {pending ? <Loader2Icon className="animate-spin" /> : 'Registrarse'}
    </Button>
  )
}
