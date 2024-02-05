import React from 'react'
import { company } from '@/types/types'

export const CardsGrid = ({ companies }: { companies: company[] }) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      {companies.map(companyItems => (
        <div
          key={companyItems.id}
          className="bg-white rounded-lg shadow-md p-4"
        >
          <h3 className="text-xl font-semibold text-center">
            {companyItems.company_name}
          </h3>
          <img src={companyItems.company_logo} alt="Logo de la empresa" />
        </div>
      ))}
    </div>
  )
}
