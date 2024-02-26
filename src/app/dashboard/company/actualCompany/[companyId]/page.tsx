// export default function Home({ params }: { params: any })) {
//     const { companyId } = params
//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen py-2">
//       dashboard
//     </div>
//   )
// }
'use client'
import { useEffect, useState } from 'react'
import { useLoggedUserStore } from '@/store/loggedUser'
import { company } from '@/types/types'
export default function page({ params }: { params: any }) {
  const { companyId } = params
  const actualCompany = useLoggedUserStore(state => state.actualCompany)
  const [company, setCompany] = useState<company | null>(null)

  useEffect(() => {
    // Actualizar el estado local cuando actualCompany cambie
    if (actualCompany) {
      setCompany(actualCompany)
    }
  }, [actualCompany])

  return (
    <div>
      <h1>Detalles de la empresa</h1>
      {company && (
        <div>
          <h2>ID: {company.id}</h2>
          <h2>Nombre: {company.company_name}</h2>
          {/* Mostrar otros campos de la empresa */}
        </div>
      )}
    </div>
  )
}

//export default page
