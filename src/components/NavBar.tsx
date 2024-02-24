'use client'
import Link from 'next/link'
import React, { useState } from 'react'
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
import allCompany from '@/app/dashboard/company/page'
import ModalCompany from '@/components/ModalCompany'
export default function NavBar() {
  const allCompanies = useLoggedUserStore(state => state.allCompanies)
  const actualCompany = useLoggedUserStore(state => state.actualCompany)
  const actualUser = useLoggedUserStore(state => state.profile)
  const avatarUrl =
    actualUser && actualUser.length > 0 ? actualUser[0].avatar : ''

  const [isOpen, setIsOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openModal = (companies: any) => {
    setSelectedCompany(companies)
    setIsModalOpen(true)
  }

  return (
    <nav className="flex flex-shrink items-center justify-between text-white p-4 mb-2 bg-slate-800">
      <div className="flex items-center">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger>
            <div onMouseEnter={() => setIsOpen(true)}>
              {allCompanies
                ?.filter(companyItem => companyItem.by_defect === true)
                .map(companyItem => (
                  <Link
                    key={companyItem.id}
                    href={`/dashboard/company`}
                    passHref
                    className="text-white flex items-center gap-1 bg-slate-500 border-2 rounded-md"
                  >
                    <img
                      src={companyItem.company_logo}
                      alt="Company Logo"
                      style={{ width: '78px', height: '40px' }}
                    />
                  </Link>
                ))}
              {!allCompanies?.find(
                companyItem => companyItem.by_defect === true,
              ) && (
                <div>
                  <Link
                    href={`/dashboard/company`}
                    passHref
                    className="text-white flex items-center gap-2 p-1 bg-slate-500 border-2 rounded-md"
                  >
                    Empresa
                  </Link>
                </div>
              )}
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
            <div className=" justify-center items-center">
              {allCompanies?.map(companyItems => (
                <div
                  key={companyItems.id}
                  onClick={() => openModal(companyItems)}
                  className="text-white gap-1 flex justify-center items-center w-20 h-20"
                >
                  <img
                    className="hover:cursor-pointer shadow-md text-white items-center flex gap-1 bg-slate-500 border-2 rounded-md w-60 h-20"
                    src={companyItems.company_logo}
                    // width="60p"
                    // height="20p"
                    alt="Logo de la empresa"
                    style={{ width: '78px', height: '40px' }}
                  />
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
