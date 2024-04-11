import { AlertComponent } from '@/components/AlertComponent'
import NavBar from '@/components/NavBar'
import SideBar from '@/components/Sidebar'
import { cn } from '@/lib/utils'
import { Inter } from 'next/font/google'
import '../globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 'md:w-[200px]' : 'w-[68px] '
  const maxW = 'max-w-[calc(100vw - 700px)]'
  return (
    <div className="flex">
      <AlertComponent />
      <SideBar />
      <div className="flex flex-col w-full mt-1 md:mt-0">
        <NavBar />
        <div className={cn('md:px-12 md:max-w-[calc(100vw-190px)]')}>
          {children}
        </div>
      </div>
    </div>
  )
}
