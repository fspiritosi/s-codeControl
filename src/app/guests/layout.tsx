import NavBar from '@/components/NavBar'
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

    return (
        <div className="flex flex-col">

            <div className="w-full mt-1 md:mt-0 bg-muted/40">
                <NavBar />
            </div>

            <div className="w-full mt-4">
                {children}
            </div>
        </div>
    )
}
