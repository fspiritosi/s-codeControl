'use client';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { RiMenu3Line } from 'react-icons/ri';
import Logo_Blanco from '../../../public/logoLetrasBlancas.png';
import Logo from '../../../public/logoLetrasNegras.png';
import { ModeToggle } from '../ui/ToogleDarkButton';
import { Button } from '../ui/button';
import MotionTransition from './Animation/MotionTransition';

function Header() {
  //--Estados locales--//
  const [openMobileMenu, setOpenMobileMenu] = useState(false);
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
  ];

  //--funcionalidades --//

  return (
    <MotionTransition>
      <nav className="flex flex-wrap items-center justify-around md:justify-between max-w-5xl my-4 mx-4 md:py-4 md:m-auto">
        <Link href="/" className="flex items-center">
          <Image src={theme == 'dark' ? Logo_Blanco : Logo} width={120} height={60} alt="codeControl Logo" />
        </Link>
        <ModeToggle />
        <RiMenu3Line
          className="block text-3xl md:hidden cursor-pointer"
          onClick={() => setOpenMobileMenu(!openMobileMenu)}
        />

        <div className={`${openMobileMenu ? 'block' : 'hidden'} w-full md:block md:w-auto`}>
          <div className="flex flex-col p-4 mt-4 md:p-0 md:flex-row md:space-x-8 md:mt-0 md:border-0">
            {dataHeader?.map(({ id, name, idLink }) => (
              <div key={id} className="px-4 transition-all duration-500 ease-in-out">
                <Link href={idLink} className=" hover:text-cyan-600">
                  {name}
                </Link>
              </div>
            ))}
          </div>
        </div>
        <Link href="/login">
          <Button variant="default">Login</Button>
        </Link>
        <Link href="/register">
          <Button variant="outline">Registrate</Button>
        </Link>
      </nav>
    </MotionTransition>
  );
}

export default Header;
