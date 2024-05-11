import { AlertComponent } from '@/components/AlertComponent'
import NavBar from '@/components/NavBar'
import SideBar from '@/components/Sidebar'
import { supabaseServer } from '@/lib/supabase/server'
import { Inter } from 'next/font/google'
import '../globals.css'

const inter = Inter({ subsets: ['latin'] })

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = supabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profile')
    .select('*')
    .eq('credential_id', user?.id || '')

  return (
    <div className="flex">
      <AlertComponent />
      <SideBar />
      <div className="flex flex-col w-full mt-1 md:mt-0">
        <NavBar profile={profile} />
        <div>{children}</div>
      </div>
    </div>
  )
}
