import Link from 'next/link'
import { LogOutButton } from './LogOutButton'
export default function NavBar() {
  return (
    <nav className="flex items-center justify-between bg-gray-800 text-white p-4 rounded-md mb-2">
      <div className="flex items-center">
        <Link
          href="/dashboard"
          passHref
          className="text-white text-2xl font-bold"
        >
          Home
        </Link>
      </div>

      <div className="flex items-center">
        <LogOutButton />
      </div>
    </nav>
  )
}
