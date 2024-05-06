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
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Toggle } from '@/components/ui/toggle'
import { useLoggedUserStore } from '@/store/loggedUser'
import { registerSchemaWithRole } from '@/zodSchemas/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { EyeClosedIcon, EyeOpenIcon } from '@radix-ui/react-icons'
import Image from 'next/image'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { supabase } from '../../../../../supabase/supabase'
import { columns } from './components/columns'
import { DataTable } from './components/data-table'
import { ItemCompany } from './components/itemCompany'
export default function page() {
  const company = useLoggedUserStore(state => state.actualCompany)
  const actualCompany = useLoggedUserStore(state => state.actualCompany)
  const [verify, setVerify] = useState(false)
  const ownerUser = useLoggedUserStore(state => state.profile)
  const [showPasswords, setShowPasswords] = useState(false)
  const [open, setOpen] = useState(false)
  const owner = ownerUser?.map(user => {
    return {
      email: user.email,
      fullname: user.fullname as string,
      role: 'Propietario',
      alta: user.created_at ? new Date(user.created_at) : new Date(),
      id: user.id || '',
      img: user.avatar || '',
    }
  })

  const sharedUsers =
    actualCompany?.share_company_users.map(user => {
      return {
        email: user.profile.email,
        fullname: user.profile.fullname,
        role: user.role,
        alta: user.created_at,
        id: user.id,
        img: user.profile.avatar || '',
      }
    }) || []

  const data = owner?.concat(sharedUsers || [])

  function compare(text: string) {
    if (text === company?.company_name) {
      setVerify(true)
    } else {
      setVerify(false)
    }
  }

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

  function onSubmit(values: z.infer<typeof registerSchemaWithRole>) {
    // toast('Event has been created.')
    //-> verificar si hay una cuenta con el mismo correo

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
    console.log(values)
  }

  return (
    <div className="flex flex-col gap-6 py-4 px-6">
      <div className="w-full flex mb-6">
        <Image
          src={company?.company_logo || ''}
          alt={company?.company_name || ''}
          width={200}
          height={200}
        />
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="modules">Modulos</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="space-y-4">
          <Card className="py-4 px-4 ">
            <CardHeader>
              <CardTitle>Datos generales de la empresa</CardTitle>
            </CardHeader>
            <CardContent>
              {company && (
                <div>
                  <ItemCompany
                    name="Razón Social"
                    info={company.company_name}
                  />
                  <ItemCompany name="CUIT" info={company.company_cuit} />
                  <ItemCompany name="Dirección" info={company.address} />
                  <ItemCompany name="Pais" info={company.country} />
                  <ItemCompany name="Ciudad" info={company.city.name} />
                  <ItemCompany name="Industria" info={company.industry} />
                  <ItemCompany
                    name="Teléfono de contacto"
                    info={company.contact_phone}
                  />
                  <ItemCompany
                    name="Email de contacto"
                    info={company.contact_email}
                  />
                </div>
              )}
            </CardContent>
          </Card>
          <Card className=" bg-red-300 border-red-800 border-spacing-2 border-2">
            <CardHeader>ZONA PELIGROSA</CardHeader>
            <CardContent>
              <p>
                Al eliminiar esta empresa se eliminarán todos los registros
                asociado a ella.
              </p>
              <p>Esta acción no se puede deshacer.</p>
            </CardContent>
            <CardFooter>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-red-500 bg-opacity-80 border-red-700 border-2 text-red-700 hover:bg-red-700 hover:text-red-500"
                  >
                    Eliminar Empresa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      Confirmar eliminación de la empresa
                    </DialogTitle>
                    <DialogDescription>
                      Esta acción no se puede deshacer.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col">
                    <p>
                      Por favor escribe <strong>{company?.company_name}</strong>{' '}
                      para confirmar.
                    </p>
                    <div className="grid flex-1 gap-2">
                      <Input
                        id="user_input"
                        type="text"
                        onChange={e => compare(e.target.value)}
                        className={
                          verify
                            ? 'border-green-400 bg-green-300 text-green-700'
                            : 'focus:border-red-400 focus:bg-red-300 text-red-700'
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter className="sm:justify-between">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cerrar
                      </Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button type="button" variant="destructive">
                        Eliminar
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="users">
          <Card>
            <div className=" h-full flex-1 flex-col space-y-8 p-8 md:flex">
              <div className="flex items-center justify-between space-y-2">
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
                                      <Input
                                        placeholder="Tu apellido"
                                        {...field}
                                      />
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
                                          type={
                                            showPasswords ? 'text' : 'password'
                                          }
                                          autoComplete="new-password"
                                          {...field}
                                        />
                                      </FormControl>
                                      <Toggle
                                        onClick={() =>
                                          setShowPasswords(!showPasswords)
                                        }
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
                                          type={
                                            showPasswords ? 'text' : 'password'
                                          }
                                          autoComplete="new-password"
                                          {...field}
                                        />
                                      </FormControl>
                                      <Toggle
                                        onClick={() =>
                                          setShowPasswords(!showPasswords)
                                        }
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
                                    <FormLabel>Rol</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Rol"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      Por favor ingresa el rol del usuario.
                                    </FormDescription>
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
              </div>
              <DataTable data={data || []} columns={columns} />
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="modules">Change your password here.</TabsContent>
      </Tabs>
    </div>
  )
}
