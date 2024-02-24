import { AlertComponent } from '@/components/AlertComponent'
import NavBar from '@/components/NavBar'
import SideBar from '@/components/Sidebar'
import { Inter } from 'next/font/google'
import '../globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex">
      <AlertComponent />
      <SideBar />
      <div className="flex flex-col w-full mt-1 md:mt-0">
        <NavBar />
        <div className=" md:px-12">{children}</div>
      </div>
    </div>
  )
}
