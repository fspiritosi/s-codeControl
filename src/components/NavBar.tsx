'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { FormProvider, useForm } from 'react-hook-form'
import { supabase } from '../../supabase/supabase'
import { UpdateUserPasswordForm } from './UpdateUserPasswordForm'
import { UploadImage } from './UploadImage'

import ModalCompany from '@/components/ModalCompany'
import { ModeToggle } from '@/components/ui/ToogleDarkButton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useLoggedUserStore } from '@/store/loggedUser'
import { companyData } from '@/types/types'
import { BellIcon, DotFilledIcon } from '@radix-ui/react-icons'
import { Separator } from '@radix-ui/react-select'
import { formatRelative } from 'date-fns'
import { es } from 'date-fns/locale'
import { Check } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { IoMdAddCircleOutline } from 'react-icons/io'
import { LogOutButton } from './LogOutButton'
export default function NavBar() {
  const allCompanies = useLoggedUserStore(state => state.allCompanies)
  const actualCompany = useLoggedUserStore(state => state.actualCompany)
  const setNewDefectCompany = useLoggedUserStore(
    state => state.setNewDefectCompany,
  )
  const actualUser = useLoggedUserStore(state => state.profile)
  const notifications = useLoggedUserStore(state => state.notifications)
  const avatarUrl =
    actualUser && actualUser.length > 0 ? actualUser[0].avatar : ''

  const [isOpen, setIsOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()

  const handleNewCompany = async (company: companyData) => {
    setNewDefectCompany(company)
    setIsOpen(false)
    router.push('/dashboard')
  }
  const { control, formState, setValue } = useForm()
  const updateProfileAvatar = async (imageUrl: string) => {
    try {
      // Realiza la actualización en la tabla profile usando Supabase
      const { data, error } = await supabase
        .from('profile')
        .update({ avatar: imageUrl })
        .eq('id', actualUser[0].id)
      //console.log('user: ', actualUser[0].id)

      if (error) {
        throw error
      }

      //console.log('URL de la imagen actualizada en la tabla profile:', imageUrl)
    } catch (error) {
      console.error('Error al actualizar la URL de la imagen:', error)
    }
  }

  const markAllAsRead = useLoggedUserStore(state => state.markAllAsRead)
  return (
    <nav className=" flex flex-shrink items-center justify-between  text-white p-4 mb-2">
      <div className="flex items-center">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger>
            <div onMouseEnter={() => setIsOpen(true)}>
              {actualCompany ? (
                <Link
                  href={`/dashboard/company`}
                  passHref
                  className="text-white flex items-center gap-1 bg-slate-500 border-2 rounded-full w-40px h-40px"
                >
                  <img
                    className=" shadow-md text-white items-center flex gap-1 bg-slate-500 border-0 rounded-full w-40px h-40px"
                    src={actualCompany.company_logo}
                    style={{ width: '40px', height: '40px' }}
                    alt="Company Logo"
                  />
                </Link>
              ) : (
                allCompanies
                  ?.filter(companyItem => companyItem.by_defect === true)
                  .map(companyItem => (
                    <Link
                      key={companyItem.id}
                      href={`/dashboard/company`}
                      passHref
                      className=" shadow-md text-white items-center flex gap-1 bg-slate-500 border-2 rounded-full w-40px h-40px "
                      //className="text-white flex items-center gap-1 bg-slate-500 border-2 rounded-full w-40px h-40px"
                    >
                      <img
                        src={companyItem.company_logo}
                        style={{ width: '40px', height: '40px' }}
                        className="hover:cursor-pointer shadow-md text-white items-center flex gap-1 bg-slate-500 border-2 rounded-full w-40px h-40px"
                        alt="Company Logo"
                      />
                    </Link>
                  ))
              )}

              {!actualCompany &&
                !allCompanies?.find(
                  companyItem => companyItem.by_defect === true,
                ) && (
                  <div>
                    <Link
                      href={`/dashboard/company/`}
                      passHref
                      className="shadow-md text-white items-center flex gap-1 bg-slate-500 border-2 rounded-full w-40px h-40px "
                      //className="text-white flex items-center gap-2 p-1 bg-slate-500 border-2 rounded-md"
                    >
                      Empresa
                    </Link>
                  </div>
                )}
            </div>
          </PopoverTrigger>
          <PopoverContent
            onMouseLeave={() => setIsOpen(false)}
            className="bg-slate-600 border-0"
          >
            <Link
              href="/dashboard/company/new"
              passHref
              className="text-white hover:text-sky-600 flex justify-center items-center gap-1 px-4 py-2 text-sm"
            >
              <IoMdAddCircleOutline size={30} />
              <span>Registrar Empresa</span>
            </Link>
            <div className=" justify-center items-center">
              {allCompanies?.map(companyItems => (
                <div
                  key={companyItems.id}
                  onClick={() => handleNewCompany(companyItems)}
                  className="text-white gap-1 flex justify-left items-center w-20 h-20"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <img
                    className="hover:cursor-pointer shadow-md text-white ml-auto items-center flex gap-0 bg-slate-500 border-2 rounded-full w-40 h-40"
                    src={companyItems.company_logo}
                    alt="Logo de la empresa"
                    style={{
                      width: '40px',
                      height: '40px',
                    }}
                  />

                  <span
                    className="hover:cursor-pointer  hover:text-sky-600 text-inline ml-auto"
                    style={{
                      marginLeft: '5px',
                      marginRight: '5px',
                      float: 'right',
                    }}
                  >
                    {companyItems.company_name.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        {isModalOpen && (
          <ModalCompany
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            selectedCard={selectedCompany}
          />
        )}
      </div>
      <div className="flex gap-8 items-center">
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
          <DropdownMenuContent className="min-w-[300px] bg-transparent border-none shadow-none">
            <Card className="w-[380px]">
              <CardHeader>
                <CardTitle>Notificaciones</CardTitle>
                {notifications?.length ? (
                  <CardDescription>
                    Tienes {notifications?.length} notificaciones pendientes
                  </CardDescription>
                ) : (
                  false
                )}
                <DropdownMenuSeparator className="mb-3" />
              </CardHeader>
              <CardContent className="grid gap-4 max-h-[30vh] overflow-auto">
                {notifications?.length > 0 ? (
                  <div>
                    {notifications?.map((notification, index) => (
                      <div
                        key={index}
                        className="mb-4 grid grid-cols-[25px_1fr] pb-4 last:mb-0 last:pb-0 items-center"
                      >
                        <span className="flex h-2 w-2 translate-y-1 rounded-full bg-sky-500" />
                        <div className="space-y-1 flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium leading-none first-letter:uppercase">
                              {notification.title}
                            </p>
                            <CardDescription>
                              {notification.description.length > 50
                                ? notification.description.substring(0, 50) +
                                  '...'
                                : notification.description}
                            </CardDescription>
                            <p className="text-sm text-muted-foreground/70 first-letter:">
                              {formatRelative(
                                new Date(notification.created_at),
                                new Date(),
                                { locale: es },
                              )}
                            </p>
                          </div>
                          <Button variant="outline" className="w-20">
                            Ver
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <CardDescription>
                    No tienes notificaciones pendientes
                  </CardDescription>
                )}
              </CardContent>
              <CardFooter>
                <Button onClick={() => markAllAsRead()} className="w-full">
                  <Check
                    className="mr-2 h-4 w-4"
                    onClick={() => markAllAsRead()}
                  />{' '}
                  Marcar todos como leido
                </Button>
              </CardFooter>
            </Card>
          </DropdownMenuContent>
        </DropdownMenu>
        <ModeToggle />
        <div className="flex-shrink">
          <Popover>
            <PopoverTrigger>
              <Avatar>
                <AvatarImage src={avatarUrl} />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </PopoverTrigger>
            <PopoverContent className="bg-slate-600 border-0">
              {/* <Button className="mb-2 block">Editar Perfil</Button> */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="mb-2 block">
                    Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Editar perfil</DialogTitle>
                    <DialogDescription>
                      Aqui se haran cambios en tu perfil
                    </DialogDescription>
                  </DialogHeader>
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
                                    onImageChange={async imageUrl => {
                                      setValue('profile', imageUrl)
                                      await updateProfileAvatar(imageUrl) // Llama a la función para actualizar la URL
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
                  <DialogFooter></DialogFooter>
                </DialogContent>
              </Dialog>
              <LogOutButton />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </nav>
  )
}
