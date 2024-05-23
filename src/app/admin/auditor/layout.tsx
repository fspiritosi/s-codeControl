import { AlertComponent } from '@/components/AlertComponent'
import NavBar from '@/components/NavBar'
import SideBar from '@/components/Sidebar'
import { Inter } from 'next/font/google'
import '../../globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function AuditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex md:px-8 w-full">
      {children}
    </div>
  )
}
