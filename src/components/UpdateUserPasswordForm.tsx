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
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { CloseEyeIcon } from './svg/closeEye'
import { EyeIcon } from './svg/openEye'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Toggle } from './ui/toggle'
import { useToast } from './ui/use-toast'

export const UpdateUserPasswordForm = () => {
  const { updateUser } = useAuthData()
  const [showPassword, setShowPassword] = useState(false)
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
    } catch (error: AuthError | any) {
      toast({
        title: 'Error',
        description: `${error.message}`,
        variant: 'destructive',
      })
    } finally {
      router.push('/login')
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
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="contraseña segura"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <Toggle
                  onClick={() => setShowPassword(!showPassword)}
                  variant={'outline'}
                >
                  {showPassword ? <CloseEyeIcon /> : <EyeIcon />}
                </Toggle>
              </div>
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
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="contraseña segura"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <Toggle
                  onClick={() => setShowPassword(!showPassword)}
                  variant={'outline'}
                >
                  {showPassword ? <CloseEyeIcon /> : <EyeIcon />}
                </Toggle>
              </div>
              <FormDescription>
                Ingresa tu email para recuperar tu contraseña.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Cambiar contraseña</Button>
      </form>
    </Form>
  )
}
