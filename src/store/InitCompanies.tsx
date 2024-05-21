'use client'
import { Company, SharedCompanies } from '@/zodSchemas/schemas'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useLoggedUserStore } from './loggedUser'

export default function InitCompanies({
  company,
  share_company_users,
}: {
  company: any[] | null
  share_company_users: any[] | null
}) {
  const initState = useRef(false)
  const router = useRouter()
  let actualCompany

  const documetsFetch = useLoggedUserStore(state => state.documetsFetch)
  useEffect(() => {
    console.log(company, 'company afuera')
    if (!initState.current) {
      console.log(company, 'company adentro')
      useLoggedUserStore.setState({
        sharedCompanies: share_company_users as SharedCompanies,
      })

      useLoggedUserStore.setState({ allCompanies: company as Company })

      const savedCompany = localStorage.getItem('company_id') || ''
      if (savedCompany) {
        const company = share_company_users?.find(
          company => company.company_id.id === JSON.parse(savedCompany),
        )?.company_id

        if (company) {
          useLoggedUserStore.setState({ actualCompany: company })
          actualCompany = company?.id
          return
        }
      }
      const defaultCompany = company?.filter(company => company?.by_defect)

      if (company && company?.length > 1) {
        if (defaultCompany) {
          console.log('defaultCompany', defaultCompany[0])
          useLoggedUserStore.setState({ actualCompany: defaultCompany[0] })
          actualCompany = defaultCompany?.[0]?.id
        }
      }
      if (company?.length === 1) {
        // setActualCompany(data[0])
        useLoggedUserStore.setState({ actualCompany: company?.[0] })
        actualCompany = company?.[0].id
      }
      if (company?.length === 0 && share_company_users?.length === 0) {
        const actualPath = window.location.pathname

        if (actualPath !== '/dashboard/company/new') {
          router.push('/dashboard/company/new')
        }
      }
      documetsFetch()
    }

    initState.current = true
  }, [])

  return <></>
}
