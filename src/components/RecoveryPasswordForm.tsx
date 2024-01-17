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
import { recoveryPassSchema } from '@/zodSchemas/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthError } from '@supabase/supabase-js'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Loader } from './svg/loader'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { useToast } from './ui/use-toast'
export const RecoveryPasswordForm = () => {
  const { recoveryPassword } = useAuthData()
  const { toast } = useToast()
  const [showLoader, setShowLoader] = useState(false)

  const form = useForm<z.infer<typeof recoveryPassSchema>>({
    resolver: zodResolver(recoveryPassSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (values: z.infer<typeof recoveryPassSchema>) => {
    try {
      setShowLoader(true)
      await recoveryPassword(values.email)
      toast({
        title: 'Hemos enviado un email!',
        description:
          'Si existe una cuenta creada con ese email recibiras un correo con las instrucciones',
      })
    } catch (error: AuthError | any) {
      toast({
        title: 'Error',
        description: `${error?.message}`,
        variant: 'destructive',
      })
    } finally {
      setShowLoader(false)
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
                Ingresa tu email para recuperar tu contraseña.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button disabled={showLoader} type="submit">
          {showLoader ? <Loader /> : 'Enviar'}
        </Button>
      </form>
    </Form>
  )
}
