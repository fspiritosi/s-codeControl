'use client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DatabaseIcon, Home, LineChart, Package, SearchCode, Settings, ShoppingCart, Users2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '../../../../public/logo-azul.png';

export default function AdminSideBar() {
  //TODO hacer un condicional de bg-acent para que el resaltado este en el que corresponde según el path

  const path = usePathname();
  const active =
    'flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors hover:text-foreground md:h-8 md:w-8';
  const noActive =
    'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8';

  return (
    <div className="flex flex-col bg-muted/40">
      <TooltipProvider delayDuration={100}>
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
          <nav className="flex flex-col items-center gap-4 px-2 sm:py-4">
            <Link
              href="#"
              className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
            >
              <Image src={Logo} alt="Logo Code Control" height={16} width={16}></Image>
              <span className="sr-only">Code Control</span>
            </Link>

            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/admin/panel" className={path.includes('/panel') ? active : noActive}>
                  <Home className="h-5 w-5" />
                  <span className="sr-only">Panel</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Panel</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="#" className={path.includes('/clients') ? active : noActive}>
                  <ShoppingCart className="h-5 w-5" />
                  <span className="sr-only">Clientes</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Clientes</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="#" className={path.includes('/modulos') ? active : noActive}>
                  <Package className="h-5 w-5" />
                  <span className="sr-only">Modulos</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Modulos</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="#" className={path.includes('/usuarios') ? active : noActive}>
                  <Users2 className="h-5 w-5" />
                  <span className="sr-only">Usuarios</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Usuarios</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="#" className={path.includes('/estadisticas') ? active : noActive}>
                  <LineChart className="h-5 w-5" />
                  <span className="sr-only">Estadisticas</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Estadisticas</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/admin/auditor" className={path.includes('/auditor') ? active : noActive}>
                  <SearchCode className="h-5 w-5" />
                  <span className="sr-only">Auditor</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Auditor</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/admin/tablas" className={path.includes('/tablas') ? active : noActive}>
                  <DatabaseIcon className="h-5 w-5" />
                  <span className="sr-only">Tablas</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Tablas</TooltipContent>
            </Tooltip>
          </nav>
          <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                >
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Settings</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
          </nav>
        </aside>
      </TooltipProvider>
    </div>
  );
}
