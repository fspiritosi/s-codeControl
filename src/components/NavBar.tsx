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
import { company } from '@/types/types'
export default function NavBar() {
  const allCompanies = useLoggedUserStore(state => state.allCompanies)
  const actualCompany = useLoggedUserStore(state => state.actualCompany)
  const actualUser = useLoggedUserStore(state => state.profile)
  const avatarUrl =
    actualUser && actualUser.length > 0 ? actualUser[0].avatar : ''

  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="flex flex-shrink items-center justify-between text-white p-4 mb-2 bg-slate-800">
      <div className="flex items-center">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger>
            <div onMouseEnter={() => setIsOpen(true)}>
              <Link
                href="/dashboard/company/"
                passHref
                className="text-white flex items-center gap-1 bg-slate-500 border-2 rounded-md"
              >
                {/* <MdDomainAdd size={24} /> */}
                {/* <span className="p-2">
                  {' '}
                  {actualCompany?.company_name?.toUpperCase()}
                </span> */}
                <img src={actualCompany?.company_logo} width="90" height="50" />
              </Link>
            </div>
          </PopoverTrigger>
          <PopoverContent
            onMouseLeave={() => setIsOpen(false)}
            className="bg-slate-800"
          >
            <Link
              href="/dashboard/company/new"
              passHref
              className="text-white hover:text-sky-600 flex justify-center items-center gap-1 px-4 py-2 text-sm"
            >
              <IoMdAddCircleOutline size={30} />
              <span>Registrar Empresa</span>
            </Link>
            {/* <div className=" justify-center">
              {allCompanies.map(companyItems => (
                <div
                  key={companyItems.id}
                  className="text-white gap-1 flex justify-center items-center w-20 h-20"
                  //onClick={() => handleCardClick(companyItems)} // Agrega el manejador de eventos onClick
                >
                  <img
                    className="text-white items-center flex gap-1 bg-slate-500 border-2 rounded-md w-60 h-20"
                    src={companyItems.company_logo}
                    width="60p"
                    height="20p"
                    alt="Logo de la empresa"
                  />
                </div>
              ))}
            </div> */}
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex-shrink">
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
