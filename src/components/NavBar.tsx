'use client'
import Link from 'next/link'
import { LogOutButton } from './LogOutButton'
import { useLoggedUserStore } from '@/store/loggedUser'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function NavBar() {
  const actualCompany = useLoggedUserStore(state => state.actualCompany)
  const actualUser = useLoggedUserStore(state => state.profile)
  const avatarUrl = actualUser[0].avatar

  return (
    <nav className="flex items-center justify-between text-white p-4 mb-2 bg-slate-800">
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
          <PopoverContent>
            <LogOutButton />
          </PopoverContent>
        </Popover>
      </div>
    </nav>
  )
}
