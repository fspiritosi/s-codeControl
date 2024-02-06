import React from 'react'
import { company } from '@/types/types'
import { formatCompanyName } from '@/lib/utils'
interface CardsGridProps {
  companies: company[]
  onCardClick: (card: company) => void
}

export const CardsGrid: React.FC<CardsGridProps> = ({
  companies,
  onCardClick,
}) => {
  const handleCardClick = (card: company) => {
    onCardClick(card)
  }

  return (
    <div className="grid grid-cols-6 gap-4">
      {companies.map(companyItems => (
        <div
          key={companyItems.id}
          className="card hover:cursor-pointer bg-white rounded-lg shadow-md p-4"
          onClick={() => handleCardClick(companyItems)} // Agrega el manejador de eventos onClick
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
