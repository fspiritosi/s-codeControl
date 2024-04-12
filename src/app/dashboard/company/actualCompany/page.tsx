'use client'

import { useEffect, useState } from 'react'
import { useLoggedUserStore } from '@/store/loggedUser'
import { company } from '@/types/types'
export default function page() {
  const company = useLoggedUserStore(state => state.actualCompany)
  const actualCompany = useLoggedUserStore(state => state.actualCompany)
  


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
