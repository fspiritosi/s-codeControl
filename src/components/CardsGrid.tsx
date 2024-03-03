import React from 'react'
import { company, companyData } from '@/types/types'
import { formatCompanyName } from '@/lib/utils'

interface CardsGridProps {
  allCompanies: companyData[]
  onCardClick: (card: companyData) => void
}

export const CardsGrid: React.FC<CardsGridProps> = ({
  allCompanies,
  onCardClick,
}) => {
  const handleCardClick = (card: companyData) => {
    onCardClick(card)
  }
  const activeCompanies = allCompanies.filter(company => company.is_active)
  return (
    <div className="grid grid-cols-6 gap-4">
      {activeCompanies.map(companyItems => (
        <div
          key={companyItems.id}
          className="card hover:cursor-pointer bg-white text-black rounded-lg shadow-md p-4"
          onClick={() => handleCardClick(companyItems)}
        >
          <h3 className="text-xl font-semibold text-center">
            {formatCompanyName(companyItems.company_name)}
          </h3>
          <img src={companyItems.company_logo} alt="Logo de la empresa" />
        </div>
      ))}
    </div>
  )
}
