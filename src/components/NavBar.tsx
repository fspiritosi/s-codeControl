'use client'
import { ModeToggle } from '@/components/ui/ToogleDarkButton'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useLoggedUserStore } from '@/store/loggedUser'
import Link from 'next/link'
import { useState } from 'react'
import { LogOutButton } from './LogOutButton'

import ModalCompany from '@/components/ModalCompany'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { companyData } from '@/types/types'
import { useRouter } from 'next/navigation'
import { IoMdAddCircleOutline } from 'react-icons/io'

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

  return (
    <nav className=" flex flex-shrink items-center justify-between  text-white p-4 mb-2 ">
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
