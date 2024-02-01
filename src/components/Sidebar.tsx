'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
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

  const toggleSidebar = () => {
    setExpanded(!expanded)
  }
  return (
    <div
      className={`flex-grow justify-bettween h-full md:flex-col d:space-x-0 md:space-y-2 px-3 py-0 md:px-2 ${
        expanded ? 'expanded' : 'collapsed'
      } bg-slate-800 height: 100vh`}
      style={{ height: '150vh', width: expanded ? 200 : '68px' }}
    >
      <Link
        className={`flex h-20 items-center justify-center rounded-md bg-slate-800 p-4${
          expanded ? '40' : '40'
        }`}
        href="/"
      >
        <div
          className={`flex items-center justify-center `}
          style={{ width: '200px', height: '200px' }}
        >
          {expanded ? (
            <Image
              src={Logo}
              alt="Logo code control"
              layout="responsive"
              width={100}
              height={100}
            />
          ) : (
            <Image src={Logo1} alt="Logo code control" layout="responsive" />
          )}
        </div>
      </Link>

      <div className="flex grow flex-row justify-between space-x-2 md:flex-col md:space-x-0 md:space-y-2">
        <button
          className="mt-2 px-3 py-1 text-white bg-slate-800 rounded-md hover:text-blue-600 focus:outline-none"
          onClick={toggleSidebar}
          style={{
            display: 'flex',
            justifyContent: expanded ? 'flex-end' : 'flex-end',
          }}
        >
          {expanded ? (
            <TbLayoutSidebarRightExpand size={20} />
          ) : (
            <TbLayoutSidebarLeftExpand size={20} />
          )}
        </button>
        <SideLinks expanded={expanded} />{' '}
        {/* Pasar el estado expanded a SideLinks */}
      </div>
    </div>
  )
}
