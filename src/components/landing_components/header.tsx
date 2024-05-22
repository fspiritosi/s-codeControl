'use client'
import Link from 'next/link'
import Image from 'next/image'
import Logo from '../../../public/logoLetrasNegras.png'
import Logo_Blanco from '../../../public/logoLetrasBlancas.png'
import { RiMenu3Line } from 'react-icons/ri'
import { useState } from 'react'
import MotionTransition from './Animation/MotionTransition'
import { useTheme } from 'next-themes'
import { ModeToggle } from '../ui/ToogleDarkButton'

function Header() {
  //--Estados locales--//
  const [openMobileMenu, setOpenMobileMenu] = useState(false)
  const { theme } = useTheme();

  //-- Data --//

  const dataHeader = [
    {
      id: 1,
      name: 'Quienes Somos',
      idLink: '#about',
    },
    {
      id: 2,
      name: 'Servicios',
      idLink: '#services',
    },
    {
      id: 3,
      name: 'Clientes',
      idLink: '#clients',
    },
    {
      id: 4,
      name: 'Contactanos',
      idLink: '#contact',
    },
  ]

  //--funcionalidades --//

  return (
    <MotionTransition>
      <nav className="flex flex-wrap items-center justify-around md:justify-between max-w-5xl my-4 mx-4 md:py-4 md:m-auto">
        <Link href="/" className="flex items-center">
          <Image src={theme == "dark" ? Logo_Blanco : Logo  } width={120} height={60} alt="codeControl Logo" />
        </Link>
        <ModeToggle/>
        <RiMenu3Line
          className="block text-3xl md:hidden cursor-pointer"
          onClick={() => setOpenMobileMenu(!openMobileMenu)}
        />
        <div
          className={`${
            openMobileMenu ? 'block' : 'hidden'
          } w-full md:block md:w-auto`}
        >
          <div className="flex flex-col p-4 mt-4 md:p-0 md:flex-row md:space-x-8 md:mt-0 md:border-0">
            {dataHeader?.map(({ id, name, idLink }) => (
              <div
                key={id}
                className="px-4 transition-all duration-500 ease-in-out"
              >
                <Link href={idLink} className="text-lg hover:text-cyan-600">
                  {name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      
      </nav>
    </MotionTransition>
  )
}

export default Header
