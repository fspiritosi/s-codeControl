'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

export default function InitCompanies({
  company,
  share_company_users,
}: {
  company: any[] | null
  share_company_users: any[] | null
}) {
  const initState = useRef(false)
  const router = useRouter()

  useEffect(() => {
    if (!initState.current) {
      if (company?.length === 0 && share_company_users?.length === 0) {
        const actualPath = window.location.pathname

        if (actualPath !== '/dashboard/company/new') {
          router.push('/dashboard/company/new')
        }
      }
    }

    initState.current = true
  }, [])

  return <></>
}
