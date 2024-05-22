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

  if (company?.length === 0 && share_company_users?.length === 0) {
    const actualPath = window.location.pathname

    if (actualPath !== '/dashboard/company/new') {
      router.push('/dashboard/company/new')
    }
  }

  return <></>
}
