'use client'
import { useEdgeFunctions } from '@/hooks/useEdgeFunctions'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { supabase } from '../../../../../supabase/supabase'
import { Skeleton } from "@/components/ui/skeleton"


export default function Callback() {
  const router = useRouter()
  const { errorTranslate } = useEdgeFunctions()
  const getSession = async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()
    if (session) {
      router.push('/dashboard')
    }
    if (error) {
      const message = await errorTranslate(error.message)
      throw new Error(String(message).replaceAll('"', ''))
    }
  }

  useEffect(() => {
    getSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="flex min-h-screen">
      <aside className="w-1/5 px-4 py-5 box-border">
        {/* Sidebar */}
        <Skeleton className="h-[95vh] w-full " />
      </aside>
      <div className="flex flex-col w-full">
        <nav className=" p-4">
          {/* Navbar */}
          <Skeleton className="h-10 w-full " />
        </nav>
        <section className="p-4">
          {/* Employee Table */}
          <Skeleton className="h-96 w-full " />
          <Skeleton className="h-4 mt-4" />
          <Skeleton className="h-4 mt-2" />
          <Skeleton className="h-4 mt-2" />
          <Skeleton className="h-4 mt-2" />
          <Skeleton className="h-52 w-full mt-2" />
          <Skeleton className="h-52 w-full mt-2" />
        </section>
      </div>
    </main>
  )
}
