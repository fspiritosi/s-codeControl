'use client'

import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import {
  TbLayoutSidebarLeftExpand,
  TbLayoutSidebarRightExpand,
} from 'react-icons/tb'
import Logo1 from '../../public/logo-azul.png'
import LogoBlanco from '../../public/logoLetrasBlancas.png'
import LogoNegro from '../../public/logoLetrasNegras.png'
import SideLinks from './SideLinks'

export default function SideBar() {
  const [expanded, setExpanded] = useState(true)
  const { theme } = useTheme()
  const toggleSidebar = () => {
    setExpanded(!expanded)
  }

  return (
    <div
      className={cn(
        'flex-col  px-3 py-0 md:px-2 bg-muted dark:bg-muted/50 border-r-2 h-screen w-[68px] sticky left-0 top-0 hidden md:flex',
        expanded ? 'w-[200px]' : 'w-[68px] ',
      )}
    >
      <Link
        className={`flex h-20 items-center justify-center rounded-md  p-4${
          expanded ? '40' : '40'
        }`}
        href="/dashboard"
      >
        <div className={`flex items-center justify-center `}>
          {expanded ? (
            <Image
              placeholder="blur"
              priority={true}
              src={theme == 'dark' ? LogoBlanco : LogoNegro}
              alt="Logo code control"
              width={150}
            />
          ) : (
            <Image src={Logo1} alt="Logo code control" />
          )}
        </div>
      </Link>

      <div className="flex flex-col mt-2 space-y-2">
        <button
          className="px-3 py-1 dark:text-neutral-100 text-neutral-950  ml-auto rounded-md hover:text-blue-600 focus:outline-none justify-rigth"
          onClick={toggleSidebar}
        >
          {expanded ? (
            <TbLayoutSidebarRightExpand size={20} />
          ) : (
            <TbLayoutSidebarLeftExpand size={20} />
          )}
        </button>
        <SideLinks expanded={expanded} />
      </div>
    </div>
  )
}
