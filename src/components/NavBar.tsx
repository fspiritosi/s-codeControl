'use client'
import ModalCompany from '@/components/ModalCompany'
import { ModeToggle } from '@/components/ui/ToogleDarkButton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
import { BellRing, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

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

  const notifications = [
    {
      title: 'Tu llamada ha sido confirmada.',
      description: 'Hace 1 hora',
    },
    {
      title: '¡Tienes un nuevo mensaje!',
      description: 'Hace 1 hora',
    },
    {
      title: '¡Tu suscripción está por vencer!',
      description: 'Hace 2 horas',
    },
  ]

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
              <DotFilledIcon className="text-blue-600 absolute size-7 top-[-8px] right-[-10px] p-0" />
              <BellIcon className="text-black cursor-pointer size-5 dark:text-white" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-[300px] bg-transparent border-none shadow-none">
            <Card className="w-[380px]">
              <CardHeader>
                <CardTitle>Notificaciones</CardTitle>
                <CardDescription>
                  Tienes 3 notificaciones pendientes
                </CardDescription>
                <DropdownMenuSeparator className="mb-3" />
              </CardHeader>
              <CardContent className="grid gap-4">
                <div>
                  {notifications.map((notification, index) => (
                    <div
                      key={index}
                      className="mb-4 grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0"
                    >
                      <span className="flex h-2 w-2 translate-y-1 rounded-full bg-sky-500" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {notification.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">
                  <Check className="mr-2 h-4 w-4" /> Mark all as read
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
              <LogOutButton />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </nav>
  )
}
