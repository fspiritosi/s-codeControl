'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  TbLayoutSidebarLeftExpand,
  TbLayoutSidebarRightExpand,
} from 'react-icons/tb'
import Logo1 from '../../public/logo-azul.png'
import Logo from '../../public/logoLetrasBlancas.png'
import SideLinks from './SideLinks'
interface SideBarProps {
  expanded: boolean
}

export default function SideBar() {
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setExpanded(false)
      } else {
        setExpanded(true)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const toggleSidebar = () => {
    setExpanded(!expanded)
  }

  return (
    <div
      className={`flex flex-col h-full px-3 py-0 md:px-2 bg-slate-800 ${
        expanded ? 'expanded' : 'collapsed'
      }`}
      style={{ width: expanded ? 200 : '68px', height: '100vh' }}
    >
      <Link
        className={`flex h-20 items-center justify-center rounded-md bg-slate-800 p-4${
          expanded ? '40' : '40'
        }`}
        href="/dashboard"
      >
        <div
          className={`flex items-center justify-center `}
          style={{ width: '200px', height: '200px' }}
        >
          {expanded ? (
            <Image
              src={Logo}
              alt="Logo code control"
              width={150}
              height={150}
            />
          ) : (
            <Image src={Logo1} alt="Logo code control" layout="responsive" />
          )}
        </div>
      </Link>

      <div className="flex flex-col mt-2 space-y-2">
        <button
          className="px-3 py-1 text-white bg-slate-800 ml-auto rounded-md hover:text-blue-600 focus:outline-none justify-rigth"
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
