'use client'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuthData } from '@/hooks/useAuthData'
import { useProfileData } from '@/hooks/useProfileData'
import { registerSchema } from '@/zodSchemas/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { User } from '../types/types'

export function RegisterForm() {
  const { singUp } = useAuthData()
  const { insertProfile } = useProfileData()

  // 1. Definir el form.
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      document: '',
      birthdate: '',
    },
  })

  // 2. Definir la función submit.
  const onSubmit = async (credentials: z.infer<typeof registerSchema>) => {
    const { email, password, confirmPassword, ...rest } = credentials
    try {
      const userData = (await singUp({ email, password })) as User
      const profile = await insertProfile({
        ...rest,
        credentialId: userData.user?.id,
        email,
      })
      //!Hay que redirigir al dashboard
      console.log('User', userData.user)
      console.log('Profile', profile)
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <div className="flex flex-col h-full p-4">
      <Form {...form}>
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="nombre" {...field} />
                </FormControl>
                <FormDescription>Por favor ingresa tu nombre.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellido</FormLabel>
                <FormControl>
                  <Input placeholder="apellido" {...field} />
                </FormControl>
                <FormDescription>
                  Por favor ingresa tu apellido.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo</FormLabel>
                <FormControl>
                  <Input placeholder="correo" autoComplete="email" {...field} />
                </FormControl>
                <FormDescription>Por favor ingresa tu correo.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <Input
                    placeholder="contraseña"
                    type="password"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Por favor ingresa tu contraseña.
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
                  <Input
                    placeholder="Confirmar contraseña"
                    type="password"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Por favor ingresa otra vez tu contraseña.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="document"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Documento</FormLabel>
                <FormControl>
                  <Input
                    placeholder="documento"
                    maxLength={10}
                    onKeyPress={event => {
                      // Prevenir la entrada de caracteres no numéricos
                      if (!/[0-9]/.test(event.key)) {
                        event.preventDefault()
                      }
                    }}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Por favor ingresa tu documento.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="birthdate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de nacimiento</FormLabel>
                <FormControl>
                  <Input
                    placeholder="fecha de nacimiento"
                    type="date"
                    max={
                      new Date(
                        new Date().setFullYear(new Date().getFullYear() - 18),
                      )
                        .toISOString()
                        .split('T')[0]
                    }
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Por favor ingresa tu fecha de nacimiento.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Crear cuenta</Button>
        </form>
      </Form>
    </div>
  )
}
