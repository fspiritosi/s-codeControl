'use client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import Link from 'next/link';
import Logo_Blanco from '../../../public/logoLetrasBlancas.png';
import Logo from '../../../public/logoLetrasNegras.png';
import { ModeToggle } from '../ui/ToogleDarkButton';

const Navbar = () => {
  const { theme } = useTheme();

  const dataHeader = [
    {
      id: 1,
      name: 'Sobre Nosotros',
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

  return (
    <Card className=" bg-card py-3 px-4 border-0 flex items-center justify-between  rounded-2xl">
      <a href="#home" className="hidden md:block md:w-1/3">
        <Link href="/" className="flex items-center">
          <Image src={theme == 'dark' ? Logo_Blanco : Logo} width={120} height={60} alt="codeControl Logo" />
        </Link>
      </a>
      <div className="flex w-full ">
        <ul className="hidden md:flex items-center gap-10 text-card-foreground w-full">
          {dataHeader?.map(({ id, name, idLink }) => (
            <li key={id} className="px-4">
              <Link href={idLink} className=" hover:text-cyan-600">
                {name}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center w-full justify-between ">
          <Link href="/login" className="hidden md:block">
            <Button variant="default">Login</Button>
          </Link>
          {/* <Button className="hidden md:block ml-2 mr-2">Get Started</Button> */}

          <div className="flex md:hidden mr-2 items-center gap-2 w-full justify-between">
            {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <span className="py-2 px-2 bg-gray-100 rounded-md">Pages</span>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start">
              {landings.map((page) => (
                <DropdownMenuItem key={page.id}>
                  <Link href={page.route}>{page.title}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu> */}
            <a href="#home">
              <Link href="/" className="flex items-center">
                <Image src={theme == 'dark' ? Logo_Blanco : Logo} width={120} height={60} alt="codeControl Logo" />
              </Link>
            </a>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5 rotate-0 scale-100" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                {dataHeader?.map(({ id, name, idLink }) => (
                  <DropdownMenuItem key={id}>
                    <Link href={idLink} className=" hover:text-cyan-600">
                      {name}
                    </Link>
                  </DropdownMenuItem>
                ))}
                {/* <DropdownMenuItem>
                <a href="#features">Features</a>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <a href="#pricing">Pricing</a>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <a href="#faqs">FAQs</a>
              </DropdownMenuItem> */}
                <DropdownMenuItem>
                  <Link href="/login">
                    <Button variant="default">Login</Button>
                  </Link>
                </DropdownMenuItem>
                {/* <DropdownMenuItem>
                <Button className="w-full text-sm">Get Started</Button>
              </DropdownMenuItem> */}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <ModeToggle />
        </div>
      </div>
    </Card>
  );
};

const landings = [
  {
    id: nanoid(),
    title: 'Landing 01',
    route: '/project-management',
  },
  {
    id: nanoid(),
    title: 'Landing 02',
    route: '/crm-landing',
  },
  {
    id: nanoid(),
    title: 'Landing 03',
    route: '/ai-content-landing',
  },
  {
    id: nanoid(),
    title: 'Landing 04',
    route: '/new-intro-landing',
  },
  {
    id: nanoid(),
    title: 'Landing 05',
    route: '/about-us-landing',
  },
  {
    id: nanoid(),
    title: 'Landing 06',
    route: '/contact-us-landing',
  },
  {
    id: nanoid(),
    title: 'Landing 07',
    route: '/faqs-landing',
  },
  {
    id: nanoid(),
    title: 'Landing 08',
    route: '/pricing-landing',
  },
  {
    id: nanoid(),
    title: 'Landing 09',
    route: '/career-landing',
  },
];

export default Navbar;
