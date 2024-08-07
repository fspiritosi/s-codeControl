
import React from 'react'
import { ItemCompany } from '@/app/dashboard/company/actualCompany/components/itemCompany';
import { cookies } from 'next/headers';


interface Company {
  companyId: {
    id: string;
    company_name: string;
    description: string;
    website: string;
    contact_email: string;
    contact_phone: string;
    address: string;
    city: {name: string};
    country: string;
    industry: string;
    company_logo: string;
    is_active: boolean;
    company_cuit: string;
    province_id: number;
    owner_id: string;
    by_defect: boolean;
  }[];
}

export default async function CompanyComponent() {

  const URL = process.env.NEXT_PUBLIC_BASE_URL;
  const coockiesStore = cookies();
  const company_id = coockiesStore.get('actualComp')?.value;
  const companyResponse = await fetch(`${URL}/api/company/?actual=${company_id}`);
  const companyDataResponse = companyResponse.ok ? await companyResponse.json() : null;

  const companyData = companyDataResponse.data[0];
  
  return (
    <div>
      {companyData && ( 
        <div>
          <ItemCompany name="Razón Social" info={companyData.company_name} />
          <ItemCompany name="CUIT" info={companyData.company_cuit} />
          <ItemCompany name="Dirección" info={companyData.address} />
          <ItemCompany name="Pais" info={companyData.country} />
          <ItemCompany name="Ciudad" info={companyData.city?.name} />
          <ItemCompany name="Industria" info={companyData.industry} />
          <ItemCompany name="Teléfono de contacto" info={companyData.contact_phone} />
          <ItemCompany name="Email de contacto" info={companyData.contact_email} />
        </div>
      )}  
    </div>
  )
}
