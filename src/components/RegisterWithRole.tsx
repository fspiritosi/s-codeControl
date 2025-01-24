'use client';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { handleSupabaseError } from '@/lib/errorHandler';
import { useLoggedUserStore } from '@/store/loggedUser';
import { zodResolver } from '@hookform/resolvers/zod';
import { EyeClosedIcon, EyeOpenIcon } from '@radix-ui/react-icons';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { supabase } from '../../supabase/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Toggle } from './ui/toggle';
export const RegisterWithRole = () => {
  const [showPasswords, setShowPasswords] = useState(false);
  const [open, setOpen] = useState(false);
  const ownerUser = useLoggedUserStore((state) => state.profile);
  const [activeTab, setActiveTab] = useState('InviteUser');
  const [clientData, setClientData] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState('');
  const company = useLoggedUserStore((state) => state.actualCompany);
  const [userType, setUserType] = useState<'Usuario' | 'Invitado' | null>(null);
  const passwordSchema = z
    .string()
    .min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
    .max(50, { message: 'La contraseña debe tener menos de 50 caracteres.' })
    .regex(/[A-Z]/, {
      message: 'La contraseña debe tener al menos una mayúscula.',
    })
    .regex(/[a-z]/, {
      message: 'La contraseña debe tener al menos una minúscula.',
    })
    .regex(/[0-9]/, { message: 'La contraseña debe tener al menos un número.' })
    .regex(/[^A-Za-z0-9]/, {
      message: 'La contraseña debe tener al menos un carácter especial.',
    });

  const registerSchemaWithRole = z
    .object({
      firstname:
        activeTab === 'InviteUser'
          ? z.string().optional()
          : z
              .string()
              .min(2, {
                message: 'El nombre debe tener al menos 2 caracteres.',
              })
              .max(30, {
                message: 'El nombre debe tener menos de 30 caracteres.',
              })
              .regex(/^[a-zA-Z ]+$/, {
                message: 'El nombre solo puede contener letras.',
              })
              .trim(),
      lastname:
        activeTab === 'InviteUser'
          ? z.string().optional()
          : z
              .string()
              .min(2, {
                message: 'El apellido debe tener al menos 2 caracteres.',
              })
              .max(30, {
                message: 'El apellido debe tener menos de 30 caracteres.',
              })
              .regex(/^[a-zA-Z ]+$/, {
                message: 'El apellido solo puede contener letras.',
              })
              .trim(),
      email: z.string().email({ message: 'Email inválido' }),
      role: z.string({ required_error: 'El rol es requerido' }).min(1, {
        message: 'El rol debe tener al menos 1 caracteres.',
      }),
      customer: z.string({ required_error: 'El cliente es requerido' }).optional(),
      password: activeTab === 'InviteUser' ? z.string().optional() : passwordSchema,
      confirmPassword: activeTab === 'InviteUser' ? z.string().optional() : passwordSchema,
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Las contraseñas no coinciden.',
      path: ['confirmPassword'],
    });

  const form = useForm<z.infer<typeof registerSchemaWithRole>>({
    resolver: zodResolver(registerSchemaWithRole),
    defaultValues: {
      firstname: '',
      lastname: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: '',
      customer: '',
    },
  });

  const [roles, setRoles] = useState<any[] | null>([]);

  const getRoles = async () => {
    let { data: roles, error } = await supabase.from('roles').select('*').eq('intern', false).neq('name', 'Invitado');
    setRoles(roles);
  };

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', true)
        .eq('company_id', company?.id);
      if (error) {
        console.error('Error fetching customers:', error);
      } else {
        setClientData(data);
      }
    };
    getRoles();
    fetchCustomers();
  }, []);

  const FetchSharedUsers = useLoggedUserStore((state) => state.FetchSharedUsers);
  const router = useRouter();

  function onSubmit(values: z.infer<typeof registerSchemaWithRole>) {
    if (values?.email?.trim().toLocaleLowerCase() === ownerUser?.[0].email.toLocaleLowerCase()) {
      toast.error('No puedes compartir la empresa contigo mismo');
      return;
    }

    toast.promise(
      async () => {
        if (!company?.id) {
          throw new Error('No se encontró la empresa');
        }

        let { data: profile, error } = await supabase.from('profile').select('*').eq('email', values.email);

        if (error) {
          throw new Error(handleSupabaseError(error.message));
        }

        if (profile && profile?.length > 0) {
          const { error: duplicatedError, data: sharedCompany } = await supabase
            .from('share_company_users')
            .select('*')
            .eq('profile_id', profile[0].id)
            .eq('company_id', company?.id);

          if (sharedCompany && sharedCompany?.length > 0) {
            throw new Error('El usuario ya tiene acceso a la empresa');
          }

          //Compartir la empresa con el usuario
          const { data, error } = await supabase.from('share_company_users').insert([
            {
              company_id: company?.id,
              profile_id: profile[0].id,
              role: values?.role,
              customer_id: values?.customer ? values?.customer : null,
            },
          ]);

          if (error) {
            throw new Error(handleSupabaseError(error.message));
          }

          return 'Usuario registrado correctamente';
        }

        if (activeTab === 'InviteUser') {
          throw new Error('No se encontró un usuario con ese correo');
        }
        if (!profile || profile?.length === 0) {
          // const { data, error } = await supabase.auth.signUp({
          //   email: values.email,
          //   password: values.password!,
          
          // });
          
          const { data, error } = await supabase.auth.admin.createUser({
            email: values.email,
            password: values.password!,
            email_confirm:true
          });

          if (error) {
            throw new Error(handleSupabaseError(error.message));
          }

          if (data) {
            const { data: user, error } = await supabase
              .from('profile')
              .insert([
                {
                  id: data.user?.id,
                  email: values.email,
                  fullname: `${values.firstname} ${values.lastname}`,
                  role: 'CodeControlClient',
                  credential_id: data.user?.id,
                },
              ])
              .select();

            if (error) {
              throw new Error(handleSupabaseError(error.message));
            }

            if (user) {
              const { data, error } = await supabase.from('share_company_users').insert([
                {
                  company_id: company?.id,
                  profile_id: user?.[0].id,
                  role: values?.role,
                  customer_id: values?.customer ? values?.customer : null,
                },
              ]);
              if (error) {
                throw new Error(handleSupabaseError(error.message));
              }
              if (data) {
                return 'Usuario registrado correctamente';
              }
            }
          }
        }

        return 'Usuario registrado correctamente';
      },
      {
        loading: 'Invitando usuario...',
        success: (message) => {
          setOpen(false);
          FetchSharedUsers();
          return message;
        },
        error: (error) => {
          return error;
        },
      }
    );
    router.refresh();
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  const handleOpen = (type: 'Usuario' | 'Invitado') => {
    setUserType(type);
    setSelectedRole('Usuario');
    form.setValue('role', 'Usuario');
    if (type === 'Invitado') {
      setSelectedRole('Invitado');
      form.setValue('role', 'Invitado');
    }
    setOpen(true);
  };

  return (
    <div className="flex items-center justify-between space-y-2">
      <div></div>
      <div>
        <AlertDialog open={open} onOpenChange={() => setOpen(!open)}>
          <AlertDialogTrigger asChild>
            <Button variant="default" className="mr-2" onClick={() => handleOpen('Usuario')}>
              Agregar Usuario
            </Button>
          </AlertDialogTrigger>
          <AlertDialogTrigger asChild>
            <Button variant="default" className="ml-2" onClick={() => handleOpen('Invitado')}>
              Agregar Invitado
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-h-[90vh] overflow-y-auto">
            <AlertDialogTitle>Compartir acceso a la empresa</AlertDialogTitle>
            <Tabs
              value={activeTab}
              onValueChange={(e) => {
                handleTabChange(e);
              }}
              className=""
            >
              <TabsList className="w-full">
                <TabsTrigger className="w-1/2" value="createUser">
                  {userType === 'Usuario' ? 'Crear usuario' : 'Crear Invitado'}
                </TabsTrigger>
                <TabsTrigger className="w-1/2" value="InviteUser">
                  Invitar usuario
                </TabsTrigger>
              </TabsList>
              <TabsContent value="createUser">
                <AlertDialogHeader>
                  <AlertDialogDescription asChild>
                    <Form {...form}>
                      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
                        <FormField
                          control={form.control}
                          name="firstname"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre</FormLabel>
                              <FormControl>
                                <Input placeholder="Escribe tu nombre aquí" {...field} />
                              </FormControl>
                              <FormDescription>Por favor ingresa tu nombre.</FormDescription>
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
                              <FormDescription>Por favor ingresa tu apellido.</FormDescription>
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
                                <Input placeholder="ejemplo@correo.com" autoComplete="email" {...field} />
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
                              <div className="flex gap-2">
                                <FormControl>
                                  <Input
                                    placeholder="Elige una contraseña segura"
                                    type={showPasswords ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    {...field}
                                  />
                                </FormControl>
                                <Toggle onClick={() => setShowPasswords(!showPasswords)} variant={'outline'}>
                                  {showPasswords ? <EyeClosedIcon /> : <EyeOpenIcon />}
                                </Toggle>
                              </div>
                              <FormDescription>Por favor ingresa tu contraseña.</FormDescription>
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
                                <Toggle onClick={() => setShowPasswords(!showPasswords)} variant={'outline'}>
                                  {showPasswords ? <EyeClosedIcon /> : <EyeOpenIcon />}
                                </Toggle>
                              </div>
                              <FormDescription>Por favor ingresa otra vez tu contraseña.</FormDescription>
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
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  setSelectedRole(value); // Actualiza el estado del rol seleccionado
                                }}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar rol" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {/* {roles?.map((role) => (
                                      <SelectItem key={role.id} value={role.name}>
                                        {role.name}
                                      </SelectItem>
                                    ))} */}
                                  {selectedRole === 'Invitado' ? (
                                    <SelectItem key="invitado" value="Invitado">
                                      Invitado
                                    </SelectItem>
                                  ) : (
                                    roles?.map((role) => (
                                      <SelectItem key={role.id} value={role.name}>
                                        {role.name}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {selectedRole === 'Invitado' && (
                          <div>
                            <FormField
                              control={form.control}
                              name="customer"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Cliente</FormLabel>
                                  <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    defaultValue={selectedRole !== 'Invitado' ? ' ' : field.value}
                                  >
                                    <SelectTrigger id="customer" name="customer" className="max-w-[500px] w-[450px]">
                                      <SelectValue placeholder={'Seleccionar un cliente'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {clientData?.map((client: any) => (
                                        <SelectItem
                                          key={client?.id}
                                          value={selectedRole !== 'Invitado' ? null : client?.id}
                                        >
                                          {client?.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                        <div className="flex justify-end gap-4">
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <Button type="submit">Agregar</Button>
                        </div>
                      </form>
                    </Form>
                  </AlertDialogDescription>
                </AlertDialogHeader>
              </TabsContent>
              <TabsContent value="InviteUser">
                <AlertDialogHeader>
                  <AlertDialogDescription asChild>
                    <Form {...form}>
                      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="ml-3">Correo</FormLabel>
                              <FormControl>
                                <Input placeholder="ejemplo@correo.com" autoComplete="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="ml-3">Rol</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  setSelectedRole(value); // Actualiza el estado del rol seleccionado
                                }}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar rol" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {/* {roles?.map((role) => (
                                      <SelectItem key={role.id} value={role.name}>
                                        {role.name}
                                      </SelectItem>
                                    ))} */}
                                  {selectedRole === 'Invitado' ? (
                                    <SelectItem key="invitado" value="Invitado">
                                      Invitado
                                    </SelectItem>
                                  ) : (
                                    roles?.map((role) => (
                                      <SelectItem key={role.id} value={role.name}>
                                        {role.name}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {selectedRole === 'Invitado' && (
                          <div>
                            <FormField
                              control={form.control}
                              name="customer"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Cliente</FormLabel>
                                  <Select value={field.value} onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger id="customer" name="customer" className="max-w-[500px] w-[450px]">
                                      <SelectValue placeholder={'Seleccionar un cliente'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {clientData?.map((client: any) => (
                                        <SelectItem
                                          key={client?.id}
                                          value={selectedRole !== 'Invitado' ? null : client?.id}
                                        >
                                          {client?.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                        <div className="flex justify-end gap-4">
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <Button type="submit">Agregar</Button>
                        </div>
                      </form>
                    </Form>
                  </AlertDialogDescription>
                </AlertDialogHeader>
              </TabsContent>
            </Tabs>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
