'use client'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useAuthData } from '@/hooks/useAuthData'
import { changePassSchema } from '@/zodSchemas/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthError } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { useToast } from './ui/use-toast'

export const UpdateUserPasswordForm = () => {
  const { updateUser } = useAuthData()
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof changePassSchema>>({
    resolver: zodResolver(changePassSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values: z.infer<typeof changePassSchema>) => {
    try {
      await updateUser(values)
      toast({
        title: 'Contraseña actualizada',
        description:
          'Tu contraseña ha sido cambiada con éxito. Ya puedes iniciar sesión con tu nueva contraseña.',
      })
      router.push('/login')
    } catch (error: AuthError | any) {
      toast({
        title: 'Error',
        description: `${error.message}`,
        variant: 'destructive',
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input placeholder="contraseña segura" {...field} />
              </FormControl>
              <FormDescription>
                Ingresa tu email para recuperar tu contraseña.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar contraseña</FormLabel>
              <FormControl>
                <Input placeholder="contraseña segura" {...field} />
              </FormControl>
              <FormDescription>
                Ingresa tu email para recuperar tu contraseña.
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
