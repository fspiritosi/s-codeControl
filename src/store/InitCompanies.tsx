'use client'
import { useRouter } from 'next/navigation'

export default function InitCompanies({
  company,
  share_company_users,
}: {
  company: any[] | null
  share_company_users: any[] | null
}) {
  const router = useRouter()
  console.log('InitCompanies', company, share_company_users)

  if (company?.length === 0 && share_company_users?.length === 0) {
    if(typeof window === 'undefined') return
    const actualPath = window.location.pathname
    console.log('actualPath', actualPath)
    if (actualPath !== '/dashboard/company/new') {
      console.log('redirecting')
      router.push('/dashboard/company/new')
    }
  }

  return <></>
}
