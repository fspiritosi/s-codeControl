'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Añadir empleado', href: '/dashboard/new_employee' },
  {
    name: 'Registrar Compañia',
    href: '/dashboard/company',
  },
]

export default function SideLinks() {
  const pathname = usePathname()

  return (
    <>
      {links.map(link => {
        const LinkIcon = link
        return (
          <Link
            key={link.name}
            href={link.href}
            className={`flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3 ${
              pathname === link.href ? 'bg-sky-100 text-blue-600' : ''
            }`}
          >
            <p className="hidden md:block">{link.name}</p>
          </Link>
        )
      })}
    </>
  )
}
