'use client'
import { Skeleton } from '@/components/ui/skeleton'
import { useEdgeFunctions } from '@/hooks/useEdgeFunctions'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { supabase } from '../../../../supabase'

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

  const size = `calc(100vh - 442px)`

  return (
    <section
      className="flex min-h-screen max-h-[90vh]"
      style={{ maxHeight: '100vh', padding: '10px' }}
    >
      <aside
        className="w-1/5 px-4 box-border"
        style={{ maxHeight: '95vh', maxWidth: 250 }}
      >
        {/* Sidebar */}
        <Skeleton className="h-[95vh] w-full " />
      </aside>
      <div className="flex flex-col w-full" style={{ height: '100%' }}>
        <nav className="mb-4">
          {/* Navbar */}
          <Skeleton className="h-10 w-full " />
        </nav>
        <section className="" style={{ maxHeight: '100%', height: '100%' }}>
          {/* Employee Table */}
          <Skeleton className="h-72 w-full " />
          <Skeleton className="h-4 mt-2" />
          <Skeleton className="h-4 mt-2" />
          {/* <Skeleton className="h-52 w-full mt-2" /> */}
          <Skeleton className="w-full mt-2" style={{ height: size }} />
          {/* <Skeleton className=" h-full w-full mt-2 pb-4" /> */}
        </section>
      </div>
    </section>
  )
}
