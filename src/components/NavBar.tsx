'use client'
import Link from 'next/link'
import { LogOutButton } from './LogOutButton'
import { useLoggedUserStore } from '@/store/loggedUser'
export default function NavBar() {
  const actualCompany = useLoggedUserStore(state => state.actualCompany)
  return (
    <nav className="flex items-center justify-between bg-gray-800 text-white p-4 rounded-md mb-2">
      <div className="flex items-center">
        <Link
          href="/dashboard"
          passHref
          className="text-white text-2xl font-bold"
        >
          {actualCompany?.company_name.toUpperCase()}
        </Link>
      </div>

      <div className="flex items-center">
        <LogOutButton />
      </div>
    </nav>
  )
}
