// 'use client'
// import Link from 'next/link'
// import { usePathname } from 'next/navigation'
// import {
//   MdOutlineSpaceDashboard,
//   MdOutlinePersonAddAlt,
//   MdListAlt,
//   MdHelpOutline,
//   MdOutlinePhoneIphone,
// } from 'react-icons/md'
// const sizeIcons = 24
// const links = [
//   {
//     name: 'Dashboard',
//     href: '/dashboard',
//     icon: <MdOutlineSpaceDashboard size={sizeIcons} />,
//   },

//   {
//     name: 'Empleados',
//     href: '/dashboard/new_employee',
//     icon: <MdOutlinePersonAddAlt size={sizeIcons} />,
//   },
//   {
//     name: 'Equipos',
//     href: '/dashboard/#',
//     icon: <MdOutlinePhoneIphone size={sizeIcons} />,
//   },
//   {
//     name: 'Documentación',
//     href: '/dashboard/#',
//     icon: <MdListAlt size={sizeIcons} />,
//   },
//   {
//     name: 'Ayuda',
//     href: '/dashboard/#',
//     icon: <MdHelpOutline size={sizeIcons} />,
//   },
// ]

// export default function SideLinks({ expanded }: { expanded: boolean }) {
//   const pathname = usePathname()

//   return (
//     <>
//       {links.map(link => {
//         const LinkIcon = link.icon
//         return (
//           <Link
//             key={link.name}
//             href={link.href}
//             className={`${
//               pathname === link.href
//                 ? 'flex h-[48px] grow items-center justify-center gap-1 rounded-md bg-white p-3 text-black font-medium  md:flex-none md:justify-start md:p-2 md:px-3'
//                 : 'flex h-[48px] grow items-center justify-center gap-1 rounded-md bg-slate-800 p-3 text-white font-medium hover:bg-blue-500 hover:shadow-[0px_0px_05px_05px_rgb(255,255,255,0.40)] hover:text-white  md:flex-none md:justify-start md:p-2 md:px-3 '
//             }`}
//           >
//             {expanded ? ( // Mostrar solo el icono si la barra lateral está expandida
//               <>
//                 {link.icon}
//                 <p className="hidden md:block">{link.name}</p>
//               </>
//             ) : (
//               link.icon // Mostrar solo el icono si la barra lateral está colapsada
//             )}
//           </Link>
//         )
//       })}
//     </>
//   )
// }

/////////////////////////////////////////////////////////////////////////////////////////////
// import Link from 'next/link'
// import { useState } from 'react'
// import { usePathname } from 'next/navigation'
// import {
//   MdOutlineSpaceDashboard,
//   MdOutlinePersonAddAlt,
//   MdListAlt,
//   MdHelpOutline,
//   MdOutlinePhoneIphone,
//   MdOutlineKeyboardArrowDown,
//   MdOutlineKeyboardArrowUp,
// } from 'react-icons/md'

// const sizeIcons = 24

// const links = [
//   {
//     name: 'Dashboard',
//     href: '/dashboard',
//     icon: <MdOutlineSpaceDashboard size={sizeIcons} />,
//   },
//   {
//     name: 'Empleados',
//     href: '/dashboard/new_employee',
//     icon: <MdOutlinePersonAddAlt size={sizeIcons} />,
//     submenu: [
//       { name: 'Submenu Item 1', href: '/dashboard/submenu1' },
//       { name: 'Submenu Item 2', href: '/dashboard/submenu2' },
//     ],
//     isOpen: false, // Nuevo estado para controlar si el submenu está abierto o cerrado
//   },
//   {
//     name: 'Equipos',
//     href: '/dashboard/#',
//     icon: <MdOutlinePhoneIphone size={sizeIcons} />,
//   },
//   {
//     name: 'Documentación',
//     href: '/dashboard/#',
//     icon: <MdListAlt size={sizeIcons} />,
//   },
//   {
//     name: 'Ayuda',
//     href: '/dashboard/#',
//     icon: <MdHelpOutline size={sizeIcons} />,
//   },
// ]

// export default function SideLinks({ expanded }: { expanded: boolean }) {
//   const pathname = usePathname()

//   // Estado local para controlar la visibilidad del submenu
//   const [showSubmenu, setShowSubmenu] = useState(false)

//   return (
//     <>
//       {links.map(link => (
//         <div key={link.name}>
//           <div
//             onClick={() => {
//               if (link.submenu) {
//                 link.isOpen = !link.isOpen // Actualiza el estado del submenu al hacer clic en el botón
//                 setShowSubmenu(!showSubmenu)
//               }
//             }}
//             className={`${
//               pathname === link.href ? 'active' : 'inactive' // Clase para el estado inactivo, puedes ajustarla según tus estilos originales
//             } flex items-center justify-center gap-1 rounded-md bg-white p-3 text-black font-medium cursor-pointer`}
//             style={{ boxShadow: '0px 0px 5px 5px rgba(0, 0, 255, 0.4)' }} // Agregar sombra al botón
//           >
//             {link.icon}
//             {expanded && <p className="hidden md:block">{link.name}</p>}
//             {link.submenu && (
//               <div className="ml-2">
//                 {link.isOpen ? (
//                   <MdOutlineKeyboardArrowUp size={sizeIcons} /> // Muestra la flecha hacia arriba si el submenu está abierto
//                 ) : (
//                   <MdOutlineKeyboardArrowDown size={sizeIcons} /> // Muestra la flecha hacia abajo si el submenu está cerrado
//                 )}
//               </div>
//             )}
//           </div>
//           {/* Submenu */}
//           {showSubmenu && link.submenu && link.isOpen && (
//             <div className="ml-4 mt-1 rounded-md bg-white p-3 text-black font-medium">
//               {link.submenu.map(submenuItem => (
//                 <Link key={submenuItem.name} href={submenuItem.href} passHref>
//                   <div className="block py-2 cursor-pointer">
//                     {submenuItem.name}
//                   </div>
//                 </Link>
//               ))}
//             </div>
//           )}
//         </div>
//       ))}
//     </>
//   )
// }
////////////////////////////////////////////////////////////
import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  MdOutlineSpaceDashboard,
  MdOutlinePersonAddAlt,
  MdListAlt,
  MdHelpOutline,
  MdOutlinePhoneIphone,
  MdOutlineKeyboardArrowDown,
  MdOutlineKeyboardArrowUp,
} from 'react-icons/md'

const sizeIcons = 24

const links = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: <MdOutlineSpaceDashboard size={sizeIcons} />,
  },
  {
    name: 'Empleados',
    href: '',
    icon: <MdOutlinePersonAddAlt size={sizeIcons} />,
    submenu: [
      { name: 'Submenu Item 1', href: '/dashboard/submenu1' },
      { name: 'Submenu Item 2', href: '/dashboard/submenu2' },
    ],
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
  const [openSubMenu, setOpenSubMenu] = useState(null)

  const handleSubMenuClick = (index: any) => {
    if (openSubMenu === index) {
      setOpenSubMenu(null)
    } else {
      setOpenSubMenu(index)
    }
  }

  return (
    <>
      {links.map((link, index) => (
        <div key={link.name}>
          <Link
            href={link.href}
            className={`flex h-[48px] grow items-center justify-center gap-1 rounded-md p-3 text-black font-medium md:flex-none md:justify-start md:p-2 md:px-3 ${
              pathname === link.href
                ? 'bg-white text-black'
                : 'bg-slate-800 text-white hover:bg-blue-500 hover:shadow-[0px_0px_05px_05px_rgb(255,255,255,0.40)] hover:text-white'
            }`}
            onClick={() => handleSubMenuClick(index)}
          >
            {expanded ? (
              <>
                {link.icon}
                <p className="hidden md:block">{link.name}</p>
                {link.submenu && (
                  <div className="ml-2">
                    {openSubMenu === index ? (
                      <MdOutlineKeyboardArrowUp size={sizeIcons} />
                    ) : (
                      <MdOutlineKeyboardArrowDown size={sizeIcons} />
                    )}
                  </div>
                )}
              </>
            ) : (
              link.icon
            )}
          </Link>
          {openSubMenu === index && link.submenu && (
            <div
              className={`${
                expanded ? '' : 'absolute top-[176px]'
              } ml-0 mt-1 rounded-md bg-slate-800 p-3 text-white font-medium`}
              style={{
                marginLeft: expanded ? 0 : '1.7cm',
                width: 'fit-content',
              }}
            >
              {link.submenu.map((submenuItem, subIndex) => (
                <Link key={submenuItem.name} href={submenuItem.href} passHref>
                  <div className="block py-2 cursor-pointer">
                    {submenuItem.name}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  )
}
