'use client'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useLoggedUserStore } from '@/store/loggedUser'
import { registerSchemaWithRole } from '@/zodSchemas/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { EyeClosedIcon, EyeOpenIcon } from '@radix-ui/react-icons'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { supabase } from '../../supabase/supabase'
import { Button } from './ui/button'
import { CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Toggle } from './ui/toggle'
export const RegisterWithRole = () => {
  const [showPasswords, setShowPasswords] = useState(false)
  const [open, setOpen] = useState(false)
  const ownerUser = useLoggedUserStore(state => state.profile)
  const company = useLoggedUserStore(state => state.actualCompany)
  const form = useForm<z.infer<typeof registerSchemaWithRole>>({
    resolver: zodResolver(registerSchemaWithRole),
    defaultValues: {
      firstname: '',
      lastname: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: '',
    },
  })

  const [roles, setRoles] = useState<any[] | null>([])

  const getRoles = async () => {
    let { data: roles, error } = await supabase
      .from('roles')
      .select('*')
      .eq('intern', false)
    setRoles(roles)
  }

  useEffect(() => {
    getRoles()
  }, [])

  function onSubmit(values: z.infer<typeof registerSchemaWithRole>) {
    if (
      values.email.trim().toLocaleLowerCase() ===
      ownerUser?.[0].email.toLocaleLowerCase()
    ) {
      toast.error('No puedes compartir la empresa contigo mismo')
      return
    }

    toast.promise(
      async () => {
        let { data: profile, error } = await supabase
          .from('profile')
          .select('*')
          .eq('email', values.email)

        if (error) {
          throw new Error('Error al buscar el usuario')
        }

        if (profile && profile?.length > 0) {
          //Verificar si el usuario ya tiene acceso a la empresa
          const { error: duplicatedError } = await supabase
            .from('share_company_users')
            .select('*')
            .eq('profile_id', profile[0].id)
            .eq('company_id', company?.id)

          if (duplicatedError) {
            throw new Error('El usuario ya tiene acceso a la empresa')
          }

          //Compartir la empresa con el usuario
          const { data, error } = await supabase
            .from('share_company_users')
            .insert([
              {
                company_id: company?.id,
                profile_id: profile[0].id,
                role: values.role,
              },
            ])

          if (error) {
            throw new Error('Error al registrar el usuario')
          }

          return 'Usuario registrado correctamente'
        }

        if (!profile || profile?.length === 0) {
          const { data, error } = await supabase.auth.admin.createUser({
            email: values.email,
            password: values.password,
            email_confirm: false,
          })
          if (error) {
            throw new Error('Error al registrar el usuario')
          }

          if (data) {
            const { data: user, error } = await supabase
              .from('profile')
              .insert([
                {
                  id: data.user?.id,
                  email: values.email,
                  fullname: `${values.firstname} ${values.lastname}`,
                  role: 'Externo',
                  credential_id: data.user?.id,
                },
              ])
              .select()

            if (error) {
              throw new Error('Error al registrar el usuario')
            }

            if (user) {
              const { data, error } = await supabase
                .from('share_company_users')
                .insert([
                  {
                    company_id: company?.id,
                    profile_id: user?.[0].id,
                    role: values.role,
                  },
                ])
              if (error) {
                throw new Error('Error al registrar el usuario')
              }
              if (data) {
                return 'Usuario registrado correctamente'
              }
            }
          }
        }

        return 'Usuario registrado correctamente'
      },
      {
        loading: 'Verificando si el usuario ya existe...',
        success: message => message,
        error: err => err.message,
      },
    )
  }

  return (
    <div className="flex items-center justify-between space-y-2">
      <CardHeader className="w-full flex flex-row justify-between items-start bg-muted dark:bg-muted/50 border-b-2">
        <div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Compartir acceso
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Comparte el acceso a tu empresa con otros usuarios.
          </CardDescription>
        </div>
        <div>
          <AlertDialog open={open} onOpenChange={() => setOpen(!open)}>
            <AlertDialogTrigger asChild>
              <Button variant="outline">Agregar Usuario</Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-h-[90vh] overflow-y-auto">
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Compartir acceso a la empresa
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <Form {...form}>
                    <form
                      className="space-y-5"
                      onSubmit={form.handleSubmit(onSubmit)}
                    >
                      <FormField
                        control={form.control}
                        name="firstname"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Escribe tu nombre aquí"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Por favor ingresa tu nombre.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastname"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Apellido</FormLabel>
                            <FormControl>
                              <Input placeholder="Tu apellido" {...field} />
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
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contraseña</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input
                                  placeholder="Elige una contraseña segura"
                                  type={showPasswords ? 'text' : 'password'}
                                  autoComplete="new-password"
                                  {...field}
                                />
                              </FormControl>
                              <Toggle
                                onClick={() => setShowPasswords(!showPasswords)}
                                variant={'outline'}
                              >
                                {showPasswords ? (
                                  <EyeClosedIcon />
                                ) : (
                                  <EyeOpenIcon />
                                )}
                              </Toggle>
                            </div>
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
                            <div className="flex gap-2">
                              <FormControl>
                                <Input
                                  placeholder="Repite tu contraseña"
                                  type={showPasswords ? 'text' : 'password'}
                                  autoComplete="new-password"
                                  {...field}
                                />
                              </FormControl>
                              <Toggle
                                onClick={() => setShowPasswords(!showPasswords)}
                                variant={'outline'}
                              >
                                {showPasswords ? (
                                  <EyeClosedIcon />
                                ) : (
                                  <EyeOpenIcon />
                                )}
                              </Toggle>
                            </div>
                            <FormDescription>
                              Por favor ingresa otra vez tu contraseña.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar rol" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {roles?.map(role => (
                                  <SelectItem key={role.id} value={role.name}>
                                    {role.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-4">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <Button type="submit">Agregar</Button>
                      </div>
                    </form>
                  </Form>
                </AlertDialogDescription>
              </AlertDialogHeader>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
    </div>
  )
}
