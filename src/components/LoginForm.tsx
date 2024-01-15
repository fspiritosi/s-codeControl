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
import { Toggle } from '@/components/ui/toggle'
import { useAuthData } from '@/hooks/useAuthData'
import { loginSchema } from '@/zodSchemas/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthError } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { CloseEyeIcon } from './svg/closeEye'
import { GoogleIcon } from './svg/google'
import { EyeIcon } from './svg/openEye'
import { Separator } from './ui/separator'
import { useToast } from './ui/use-toast'

export function LoginForm() {
  const { login, googleLogin } = useAuthData()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (credentials: z.infer<typeof loginSchema>) => {
    try {
      await login(credentials)
      router.push('/dashboard')
    } catch (error: AuthError | any) {
      toast({
        variant: 'destructive',
        title: `${error.message}`,
      })
    }
  }
  const loginGooglePrivider = async () => {
    try {
      const user = await googleLogin()
      return user
    } catch (error: AuthError | any) {
      toast({
        title: 'Error',
        description: `${error?.message}`,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="flex flex-col">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="m-2">Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ejemplo@correo.com"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Por favor ingresa tu correo.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="m-2">Contraseña</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="mi contraseña segura"
                      autoComplete="current-password"
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
                <div className="flex justify-between">
                  <FormDescription>
                    Por favor ingresa tu contraseña.
                  </FormDescription>
                  <a
                    href="/reset_password"
                    className="text-blue-400 text-[0.8rem]"
                  >
                    Olvidaste tu contraseña?
                  </a>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex w-full justify-center flex-col items-center gap-5">
            <Button
              className="w-[100%] sm:w-[80%] lg:w-[60%] self-center"
              type="submit"
            >
              Ingresar
            </Button>
            <a href="/register" className="text-[0.8rem]">
              ¿No tienes una cuenta?{' '}
              <span className="text-blue-400 ml-1">Créate una aquí</span>
            </a>
          </div>
        </form>
      </Form>
      <Separator
        orientation="horizontal"
        className="my-6 w-[70%] self-center"
      />
      <Button
        variant="outline"
        className="w-[100%] sm:w-[80%] lg:w-[60%] self-center"
        onClick={loginGooglePrivider}
      >
        <span className="mr-2">
          {' '}
          <GoogleIcon />
        </span>{' '}
        Inicia sesión con Google
      </Button>
    </div>
  )
}
