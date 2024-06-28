import { formatCompanyName } from '@/lib/utils';
import { Company } from '@/zodSchemas/schemas';
import React from 'react';

interface CardsGridProps {
  allCompanies: Company;
  onCardClick: (card: Company[0]) => void;
}

export const CardsGrid: React.FC<CardsGridProps> = ({ allCompanies, onCardClick }) => {
  const handleCardClick = (card: Company[0]) => {
    onCardClick(card);
  };
  const activeCompanies = allCompanies?.filter((company) => company.is_active);
  return (
    <div className="grid grid-cols-6 gap-4">
      {activeCompanies?.map((companyItems) => (
        <div
          key={companyItems.id}
          className="card hover:cursor-pointer bg-white text-black rounded-lg shadow-md p-4"
          onClick={() => handleCardClick(companyItems)}
        >
          <h3 className=" font-semibold text-center overflow-hidden whitespace-wrap ">
            {formatCompanyName(companyItems.company_name)}
          </h3>
          <img src={companyItems.company_logo} alt="Logo de la empresa" />
        </div>
      ))}
    </div>
  );
};
