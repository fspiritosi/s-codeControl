'use client'
import { useAuthData } from '@/hooks/useAuthData'
import { recoveryPassSchema } from '@/zodSchemas/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthError } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from './ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import { Input } from './ui/input'
import { useToast } from './ui/use-toast'

function LoginWithEmail() {
  const { loginOnlyEmail } = useAuthData()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof recoveryPassSchema>>({
    resolver: zodResolver(recoveryPassSchema),
    defaultValues: {
      email: '',
    },
  })

  function onSubmit({ email }: z.infer<typeof recoveryPassSchema>) {
    try {
      loginOnlyEmail(email)
      toast({
        title: 'Actualiza tu contraseña',
        description: 'Ingresa la nueva contraseña',
      })
      redirect('/login')
    } catch (error: AuthError | any) {
      toast({
        title: 'Error',
        description: `${error?.message}`,
        variant: 'destructive',
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="email@hotmail.com" {...field} />
              </FormControl>
              <FormDescription>
                Ingresa nuevamente tu correo electrónico para poder actualizar
                la contraseña.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}

export default LoginWithEmail
