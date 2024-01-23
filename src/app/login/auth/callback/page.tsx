'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { supabase } from '../../../../../supabase/supabase'

export default  function Callback() {
  const router = useRouter()
  const getSession = async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()
    if (session) {
      router.push('/dashboard')
    }
    if (error) console.log(error)
  }

  useEffect(() => {
    getSession()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <p>Loading</p>
    </main>
  )
}
