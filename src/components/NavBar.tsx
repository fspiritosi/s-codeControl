'use client';
import { logout } from '@/app/login/actions';
import { ModeToggle } from '@/components/ui/ToogleDarkButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { cn } from '@/lib/utils';
import { useLoggedUserStore } from '@/store/loggedUser';
import { Company } from '@/zodSchemas/schemas';
import {
  BellIcon,
  CaretSortIcon,
  CheckCircledIcon,
  DotFilledIcon,
  EnvelopeOpenIcon,
  ExclamationTriangleIcon,
  HamburgerMenuIcon,
  LapTimerIcon,
  PlusCircledIcon,
} from '@radix-ui/react-icons';
import { formatRelative } from 'date-fns';
import { es } from 'date-fns/locale';
import { default as Cookies, default as cookie } from 'js-cookie';
import { Check, CheckIcon, Loader } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import ModalCompany from './ModalCompany';
import { UpdateUserPasswordForm } from './UpdateUserPasswordForm';
import { UploadImage } from './UploadImage';
import { AlertDialogHeader } from './ui/alert-dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from './ui/command';
import { FormControl, FormField, FormItem, FormMessage } from './ui/form';
import { Separator } from './ui/separator';
export default function NavBar() {
  const sharedCompanies = useLoggedUserStore((state) => state.sharedCompanies);
  const allCompanies = useLoggedUserStore((state) => state.allCompanies);
  const actualCompany = useLoggedUserStore((state) => state.actualCompany)
  const setNewDefectCompany = useLoggedUserStore((state) => state.setNewDefectCompany);
  const supabase = supabaseBrowser();
  const actualUser = useLoggedUserStore((state) => state.profile);
  const notifications = useLoggedUserStore((state) => state.notifications);
  const avatarUrl = actualUser && actualUser.length > 0 ? actualUser[0] : '';

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const totalCompanies = [sharedCompanies?.map((company) => company.company_id), allCompanies].flat();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const setActualCompany = useLoggedUserStore((state) => state.setActualCompany);

  const handleNewCompany = async (company: Company[0]) => {
    Cookies.set('actualComp', company.id);
    setNewDefectCompany(company);
    setActualCompany(company);
    setIsOpen(false);
    location.replace('/dashboard');
  };
  const { control, formState, setValue } = useForm();

  const updateProfileAvatar = async (imageUrl: string) => {
    try {
      // Realiza la actualización en la tabla profile usando Supabase
      const { data, error } = await supabase
        .from('profile')
        .update({ avatar: imageUrl })
        .eq('id', actualUser[0].id || '');

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error al actualizar la URL de la imagen:', error);
    }
  };
  const [open, setOpen] = useState(false);
  const [showNewTeamDialog, setShowNewTeamDialog] = useState(false);
  const actualCompanyId = cookie.get('actualCompanyId');

  const markAllAsRead = useLoggedUserStore((state) => state.markAllAsRead);

  const groups = [
    {
      label: 'Compañia actual',
      teams:
        totalCompanies.length === 1
          ? totalCompanies
              // ?.filter(companyItem => companyItem?.id === actualCompanyId)
              ?.map((companyItem) => ({
                label: companyItem?.company_name,
                value: companyItem?.id,
                logo: companyItem?.company_logo,
              }))
          : totalCompanies
              ?.filter((companyItem) => companyItem?.id === actualCompanyId)
              ?.map((companyItem) => ({
                label: companyItem?.company_name,
                value: companyItem?.id,
                logo: companyItem?.company_logo,
              })),
    },
    {
      label: 'Otras compañias',
      teams:
        totalCompanies.length === 1
          ? []
          : totalCompanies
              ?.filter((companyItem) => companyItem?.id !== actualCompanyId)
              ?.map((companyItem) => ({
                label: companyItem?.company_name,
                value: companyItem?.id,
                logo: companyItem?.company_logo,
              })),
    },
  ];
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const handleCloseSidebar = () => {
    useLoggedUserStore.getState().toggleSidebar();
  };

  return (
    <nav className=" flex flex-shrink items-center justify-end sm:justify-between  text-white pr-4 py-4 mb-2">
      <div className=" items-center hidden sm:flex gap-6">
        <button onClick={handleCloseSidebar} className="text-white relative w-fit ml-7 ">
          <HamburgerMenuIcon className="size-8 text-black font-bold" />
        </button>
        <Dialog open={showNewTeamDialog} onOpenChange={setShowNewTeamDialog}>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild className="text-black dark:text-white">
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                aria-label="Selecciona una compañía"
                className={'min-w-[200px] justify-between'}
              >
                <Avatar className="mr-2 size-5 rounded-full">
                  <AvatarImage src={actualCompany?.company_logo} alt={actualCompany?.company_name} className="size-5 object-contain" />
                  <AvatarFallback className="uppercase">
                    {!actualCompany && <Loader className="animate-spin" />}
                    {actualCompany &&
                      !actualCompany?.company_logo &&
                      `${actualCompany?.company_name.charAt(0)}${actualCompany?.company_name.charAt(1)}`}
                  </AvatarFallback>
                </Avatar>
                <span className="uppercase">{actualCompany?.company_name}</span>
                <CaretSortIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandList>
                  <CommandInput placeholder="Buscar compañia" />
                  <CommandEmpty>Compañia no encontrada</CommandEmpty>
                  {groups?.map((group) => (
                    <CommandGroup key={group.label} heading={group.label}>
                      {group?.teams?.map((team, index) => (
                        <CommandItem
                          key={crypto.randomUUID()}
                          onSelect={() => {
                            const company = totalCompanies.find((companyItem) => companyItem?.id === team?.value);
                            if (company) {
                              handleNewCompany(company);
                            }
                            setOpen(false);
                          }}
                          className="text-sm"
                        >
                          <Avatar className="mr-2 h-5 w-5 object-contain ">
                            <AvatarImage src={team.logo} alt={team.label} className="size-5 rounded-full object-contain" />
                            <AvatarFallback>compañia</AvatarFallback>
                          </Avatar>
                          {team.label}
                          <CheckIcon
                            className={cn(
                              'ml-auto h-4 w-4',
                              actualCompany?.id === team.value ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
                </CommandList>
                <CommandSeparator />
                <div className="p-2 w-full">
                  <Link
                    href="/dashboard/company/new"
                    className={`${buttonVariants({
                      variant: 'outline',
                    })} flex justify-center p-4 w-full`}
                  >
                    <PlusCircledIcon className="mr-2 scale-[3]" />
                    Agregar compañía
                  </Link>
                </div>
              </Command>
            </PopoverContent>
          </Popover>
        </Dialog>
        {isModalOpen && (
          <ModalCompany isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} selectedCard={selectedCompany} />
        )}
      </div>
      <div className="flex gap-8 items-center">
        {actualUser?.[0]?.role === 'Admin' ||
        actualUser?.[0]?.role === 'Super Admin' ||
        actualUser?.[0]?.role === 'Developer' ? (
          <Link href="/admin/panel">
            <Button variant="default">Panel</Button>
          </Link>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <div className="relative">
              {notifications?.length ? (
                <DotFilledIcon className="text-blue-600 absolute size-7 top-[-8px] right-[-10px] p-0" />
              ) : (
                false
              )}

              <BellIcon className="text-black cursor-pointer size-5 dark:text-white" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="min-w-[400px] bg-transparent border-none shadow-none">
            <Card className="w-[600px]">
              <CardHeader>
                <CardTitle>Notificaciones</CardTitle>
                {notifications?.length ? (
                  <CardDescription>Tienes {notifications?.length} notificaciones pendientes</CardDescription>
                ) : (
                  false
                )}
                <DropdownMenuSeparator className="mb-3" />
              </CardHeader>
              <CardContent className="grid gap-6 max-h-[40vh] overflow-auto">
                {notifications?.length > 0 ? (
                  <div>
                    {notifications?.map((notification, index) => (
                      <div
                        key={crypto.randomUUID()}
                        className="mb-4 grid grid-cols-[25px_1fr] pb-4 last:mb-0 last:pb-0 items-center  gap-2"
                      >
                        {notification?.category === 'rechazado' && (
                          <ExclamationTriangleIcon className="text-yellow-800" />
                        )}
                        {notification?.category === 'aprobado' && <CheckCircledIcon className="text-green-800" />}
                        {notification?.category === 'vencimiento' && <LapTimerIcon className="text-red-800" />}
                        {notification?.category === 'noticia' && <EnvelopeOpenIcon className="text-blue-800" />}
                        {notification?.category === 'advertencia' && (
                          <ExclamationTriangleIcon className="text-yellow-800" />
                        )}

                        <div className="space-y-1 flex justify-between items-center gap-2">
                          <div>
                            <p className="text-sm font-medium leading-none first-letter:uppercase">
                              {notification?.category === 'aprobado' &&
                                `El documento ${notification?.document?.documentName || '(no disponible)'}, del ${
                                  notification.reference === 'employee' ? 'empleado' : 'vehiculo con patente'
                                } ${
                                  notification?.document?.resource
                                    ?.split(' ')
                                    ?.map((word) => word.charAt(0)?.toUpperCase() + word.slice(1).toLowerCase())
                                    .join(' ') || '(no disponible)'
                                } ha sido aprobado`}
                              {notification?.category === 'rechazado' &&
                                `El documento ${notification?.document?.documentName || '(no disponible)'}, del ${
                                  notification.reference === 'employee' ? 'empleado' : 'vehiculo con patente'
                                } ${
                                  notification.reference === 'employee'
                                    ? notification?.document?.resource
                                        .split(' ')
                                        ?.map((word) => word.charAt(0)?.toUpperCase() + word.slice(1).toLowerCase())
                                        .join(' ') || '(no disponible)'
                                    : notification?.document?.resource
                                        .split(' ')
                                        ?.map((word) => word.charAt(0)?.toUpperCase() + word.slice(1)?.toUpperCase())
                                        .join(' ') || '(no disponible)'
                                } ha sido rechazado`}
                              {notification?.category === 'vencimiento' &&
                                `El documento ${notification?.document?.documentName || '(no disponible)'}, del ${
                                  notification.reference === 'employee' ? 'empleado' : 'vehiculo con patente'
                                } ${
                                  notification?.document?.resource
                                    .split(' ')
                                    ?.map((word) => word.charAt(0)?.toUpperCase() + word.slice(1).toLowerCase())
                                    .join(' ') || '(no disponible)'
                                } ha vencido`}
                            </p>

                            <CardDescription>
                              {notification?.description.length > 50
                                ? notification?.description.substring(0, 50) + '...'
                                : notification?.description}
                            </CardDescription>
                            <p className="text-sm text-muted-foreground/70 first-letter:">
                              {notification?.created_at &&
                                formatRelative(new Date(notification?.created_at), new Date(), { locale: es })}
                            </p>
                          </div>
                          <Link
                            className={[buttonVariants({ variant: 'outline' }), 'w-20'].join(' ')}
                            href={`/dashboard/document/${notification?.document?.id}`}
                          >
                            Ver
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <CardDescription>No tienes notificaciones pendientes</CardDescription>
                )}
              </CardContent>
              <CardFooter>
                <Button onClick={() => markAllAsRead()} className="w-full">
                  <Check className="mr-2 h-4 w-4" onClick={() => markAllAsRead()} /> Marcar todos como leido
                </Button>
              </CardFooter>
            </Card>
          </DropdownMenuContent>
        </DropdownMenu>
        <ModeToggle />
        <div className="flex-shrink justify-center items-center flex">
          <DropdownMenu>
            <DropdownMenuTrigger className="cursor-pointer" asChild>
              <Avatar className="size-9">
                <AvatarImage src={typeof avatarUrl === 'object' ? avatarUrl.avatar : ''} />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {typeof avatarUrl === 'object' ? avatarUrl.fullname : ''}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {typeof avatarUrl === 'object' ? avatarUrl.email : ''}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setShowDeleteDialog(true)}>Editar perfil</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <Button variant={'destructive'} className="w-full">
                  Cerrar Sesión
                </Button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent className="sm:max-w-[500px] ">
              <AlertDialogHeader>
                <DialogTitle>Editar perfil</DialogTitle>
                <DialogDescription>Aqui se haran cambios en tu perfil</DialogDescription>
              </AlertDialogHeader>
              <div className="grid gap-4 py-4">
                <div className="w-[300px] flex  gap-2">
                  <FormProvider {...useForm()}>
                    <FormField
                      control={control}
                      name="company_logo"
                      render={({ field }) => (
                        <FormItem className=" max-w-[600px] flex flex-col justify-center">
                          <FormControl>
                            <div className="flex lg:items-center flex-wrap md:flex-nowrap flex-col lg:flex-row gap-8">
                              <UploadImage
                                companyId={actualCompany?.id as string}
                                labelInput="Avatar"
                                imageBucket="avatar"
                                desciption="Sube tu avatar"
                                style={{ width: '300px' }}
                                // onImageChange={(imageUrl: string) =>
                                //   setValue('profile', imageUrl)
                                // }
                                onImageChange={async (imageUrl) => {
                                  setValue('profile', imageUrl);
                                  await updateProfileAvatar(imageUrl); // Llama a la función para actualizar la URL
                                }}
                                // onUploadSuccess={onUploadSuccess}
                                inputStyle={{ width: '150px' }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </FormProvider>
                </div>
                <Separator className="my-4" />
                <UpdateUserPasswordForm />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </nav>
  );
}
