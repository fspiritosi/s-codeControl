'use client'
import Link from 'next/link'
import { useState } from 'react'
import { LogOutButton } from './LogOutButton'
import { useLoggedUserStore } from '@/store/loggedUser'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MdDomainAdd } from 'react-icons/md'
import { IoMdAddCircleOutline } from 'react-icons/io'
export default function NavBar() {
  const actualCompany = useLoggedUserStore(state => state.actualCompany)
  const actualUser = useLoggedUserStore(state => state.profile)
  const avatarUrl =
    actualUser && actualUser.length > 0 ? actualUser[0].avatar : ''
  const [isOpen, setIsOpen] = useState(false)
  let timer: any
  const handlePopoverEnter = () => {
    clearTimeout(timer)
    setIsOpen(true)
  }

  const handlePopoverLeave = () => {
    timer = setTimeout(() => {
      setIsOpen(false)
    }, -500)
  }

  return (
    <nav className="flex items-center justify-between text-white p-4 mb-2 bg-slate-800">
      <div className="flex items-center">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger>
            <div onPointerEnter={() => setIsOpen(true)}>
              <Link href="/dashboard/company" passHref>
                <button className="text-white flex items-center gap-1 bg-slate-500 border-2 rounded-md">
                  <MdDomainAdd />
                  <span>Empresa</span>
                </button>
              </Link>
            </div>
          </PopoverTrigger>
          <PopoverContent onPointerLeave={() => setIsOpen(false)}>
            <Link
              href="/dashboard/company/"
              passHref
              className="text-gray-900 hover:text-gray-600 block flex items-center gap-1 px-4 py-2 text-sm"
            >
              <IoMdAddCircleOutline />
              <span>Registrar Empresa</span>
            </Link>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex items-center">
        <Link
          href="/dashboard"
          passHref
          className="text-white text-2xl font-bold"
        >
          {actualCompany?.company_name?.toUpperCase()}
        </Link>
      </div>

      <div className="flex items-center">
        <Popover>
          <PopoverTrigger>
            <Avatar>
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </PopoverTrigger>
          <PopoverContent className="bg-slate-800">
            <LogOutButton />
          </PopoverContent>
        </Popover>
      </div>
    </nav>
  )
}
