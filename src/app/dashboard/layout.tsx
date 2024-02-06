import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../globals.css'
import SideBar from '@/components/Sidebar'
import NavBar from '@/components/NavBar'

const inter = Inter({ subsets: ['latin'] })

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex">
      <SideBar />
      <div className="flex flex-col w-full mt-1 md:mt-0">
        <NavBar />
        <div className=" md:px-12">{children}</div>
      </div>
    </div>
  )
}
