'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  MdOutlineSpaceDashboard,
  MdOutlinePersonAddAlt,
  MdDomainAdd,
  MdListAlt,
  MdHelpOutline,
  MdOutlinePhoneIphone,
} from 'react-icons/md'
const sizeIcons = 24
const links = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: <MdOutlineSpaceDashboard size={sizeIcons} />,
  },
  {
    name: 'Empresa',
    href: '/dashboard/company',
    icon: <MdDomainAdd size={sizeIcons} />,
  },
  {
    name: 'Empleados',
    href: '/dashboard/employee',
    icon: <MdOutlinePersonAddAlt size={sizeIcons} />,
  },
  {
    name: 'Equipos',
    href: '/dashboard/#',
    icon: <MdOutlinePhoneIphone size={sizeIcons} />,
  },
  {
    name: 'Documentación',
    href: '/dashboard/#',
    icon: <MdListAlt size={sizeIcons} />,
  },
  {
    name: 'Ayuda',
    href: '/dashboard/#',
    icon: <MdHelpOutline size={sizeIcons} />,
  },
]

export default function SideLinks({ expanded }: { expanded: boolean }) {
  const pathname = usePathname()

  return (
    <>
      {links.map(link => {
        const LinkIcon = link.icon
        return (
          <Link
            key={link.name}
            href={link.href}
            className={`flex h-[48px] grow items-center justify-center gap-6 rounded-md bg-slate-800 p-3 text-white font-medium hover:bg-blue-500 hover:shadow-[0px_0px_05px_05px_rgb(255,255,255,0.40)] hover:text-white  md:flex-none md:justify-start md:p-2 md:px-3 ${
              pathname === link.href ? 'bg-white text-slate-800' : ''
            }`}
          >
            {expanded ? ( // Mostrar solo el icono si la barra lateral está expandida
              <>
                {link.icon}
                <p className="hidden md:block">{link.name}</p>
              </>
            ) : (
              link.icon // Mostrar solo el icono si la barra lateral está colapsada
            )}
          </Link>
        )
      })}
    </>
  )
}
