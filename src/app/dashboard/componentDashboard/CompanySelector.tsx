'use client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Dialog } from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils/utils'
import { useLoggedUserStore } from '@/store/loggedUser'
import { Database } from '@/types/supabaseTypes'
import { CaretSortIcon, PlusCircledIcon } from '@radix-ui/react-icons'
import { CheckIcon, Loader } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
type Props = {
  actualCompany: {
    company_logo: string | null | undefined
    company_name: string
    id: string | undefined
  }
  groups:
    | {
        teams: {
          logo: string | null
          label: string
          value: string
        }
      }[]
    | undefined
  share_company_users:
    | {
        company: {
          company_logo: string | null | undefined
          company_name: string | undefined
          id: string | null
        }
      }[]
    | undefined
}

function CompanySelector({
  actualCompany,
  groups,
  share_company_users,
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()
  const setActualCompany = useLoggedUserStore(state => state.setActualCompany)
  const setNewDefectCompany = useLoggedUserStore(
    state => state.setNewDefectCompany,
  )

  const handleNewCompany = async (
    company: Database['public']['Tables']['company']['Row'],
  ) => {
    setNewDefectCompany(company)
    setActualCompany(company)
    setIsOpen(false)
    router.refresh()
  }
  return (
    <Dialog>
      <Popover>
        <PopoverTrigger asChild className="text-black dark:text-white">
          <Button
            variant="outline"
            role="combobox"
            // aria-expanded={open}
            aria-label="Selecciona una compañía"
            className={'w-[200px] justify-between'}
          >
            <Avatar className="mr-2 size-5 rounded-full">
              <AvatarImage
                src={actualCompany?.company_logo || ''}
                alt={actualCompany?.company_name}
                className="size-5 grayscale"
              />
              <AvatarFallback>
                <Loader className="animate-spin" />
              </AvatarFallback>
            </Avatar>

            {actualCompany?.company_name || 'No hay compañias disponibles'}
            <CaretSortIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandList>
              <CommandInput placeholder="Buscar compañia" />
              <CommandEmpty>Compañia no encontrada</CommandEmpty>
              {groups?.map(group => (
                <CommandGroup key={group.teams.value}>
                  <CommandItem
                    // onSelect={() => {
                    //   const company = totalCompanies.find(
                    //     companyItem => companyItem.id === team.value,
                    //   )
                    //   if (company) {
                    //     handleNewCompany(company)
                    //   }
                    //   // setOpen(false)
                    // }}
                    className="text-sm"
                  >
                    <Avatar className="mr-2 h-5 w-5">
                      <AvatarImage
                        src={group.teams.logo || ''}
                        alt={group.teams.label}
                        className="size-5 rounded-full"
                      />
                      <AvatarFallback>
                        {' '}
                        <Loader className="animate-spin" />
                      </AvatarFallback>
                    </Avatar>
                    {group.teams.label}
                    <CheckIcon
                      className={cn(
                        'ml-auto h-4 w-4',
                        actualCompany?.id === group.teams.value
                          ? 'opacity-100'
                          : 'opacity-0',
                      )}
                    />
                  </CommandItem>
                </CommandGroup>
              ))}
              {share_company_users?.map(company => (
                <CommandGroup
                  key={company?.company?.id}
                  heading={company?.company?.company_name}
                >
                  <CommandItem
                    // onSelect={() => {
                    //   const company = totalCompanies.find(
                    //     companyItem => companyItem.id === team.value,
                    //   )
                    //   if (company) {
                    //     handleNewCompany(company)
                    //   }
                    //   // setOpen(false)
                    // }}
                    className="text-sm"
                  >
                    <Avatar className="mr-2 h-5 w-5">
                      <AvatarImage
                        src={company?.company?.company_logo || ''}
                        alt={company?.company?.company_name}
                        className="size-5 rounded-full"
                      />
                      <AvatarFallback>
                        {' '}
                        <Loader className="animate-spin" />
                      </AvatarFallback>
                    </Avatar>
                    {company?.company?.company_name}
                    <CheckIcon
                      className={cn(
                        'ml-auto h-4 w-4',
                        actualCompany?.id === company?.company?.id
                          ? 'opacity-100'
                          : 'opacity-0',
                      )}
                    />
                  </CommandItem>
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
  )
}

export default CompanySelector
