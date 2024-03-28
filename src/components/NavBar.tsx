'use client'

import { supabase } from '../../supabase/supabase'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useForm, FormProvider } from 'react-hook-form'
import { UpdateUserPasswordForm } from './UpdateUserPasswordForm'
import { UploadImage } from './UploadImage'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import ModalCompany from '@/components/ModalCompany'
import { ModeToggle } from '@/components/ui/ToogleDarkButton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useLoggedUserStore } from '@/store/loggedUser'
import { companyData } from '@/types/types'
import { BellIcon, DotFilledIcon } from '@radix-ui/react-icons'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { IoMdAddCircleOutline } from 'react-icons/io'
import { LogOutButton } from './LogOutButton'
import { Button } from './ui/button'
import { Separator } from '@radix-ui/react-select'
export default function NavBar() {
  const allCompanies = useLoggedUserStore(state => state.allCompanies)
  const actualCompany = useLoggedUserStore(state => state.actualCompany)
  const setNewDefectCompany = useLoggedUserStore(
    state => state.setNewDefectCompany,
  )
  const actualUser = useLoggedUserStore(state => state.profile)
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
      console.log('user: ', actualUser[0].id)

      if (error) {
        throw error
      }

      console.log('URL de la imagen actualizada en la tabla profile:', imageUrl)
    } catch (error) {
      console.error('Error al actualizar la URL de la imagen:', error)
    }
  }
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
        <div className="relative">
          <DotFilledIcon className="text-blue-600 absolute size-7 top-[-8px] right-[-10px] p-0" />
          <BellIcon className="text-black cursor-pointer size-5 dark:text-white" />
        </div>
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
