import React from "react"

export type LoggedUser = {
  session: null | string
  user: {
    app_metadata: {
      provider: string
      providers: string[]
    }
    aud: string
    confirmation_sent_at: string
    created_at: string
    email: string
    id: string
    identities: any[]
    phone: string
    role: string
    updated_at: string
    user_metadata: Record<string, unknown>
  } | null
}

export type Userprofile = {}

export type profileUser = {
  id?: string
  created_at?: string
  firstName: string
  lastName: string
  credentialId: string
  email: string
  avatar?: string
}

export type company = {
  id?: string
  company_name: string
  company_cuit: string
  description: string
  website: string
  contact_email: string
  contact_phone: string
  address: string
  city: number
  country: string
  industry: string
  company_logo: string
  province_id: number
  employees_id: string[]
  owner_id: string | undefined
  
}

export type companyData = {
    id: string;
    company_name: string;
    description: string;
    website: string;
    contact_email: string;
    contact_phone: string;
    address: string;
    city: {
      name: string;
    };
    country: string;
    industry: string;
    company_logo: string;
    is_active?: boolean;
    company_cuit: string;
    province_id: {
      name: string;
    };
    owner_id: string;
    companies_employees: {
      employees: {
        id: string;
        city: {
          name: string;
        };
        cuil: string;
        file: string;
        email: string;
        phone: string;
        gender: string;
        street: string;
        picture: string;
        lastname: string;
        province: {
          name: string;
        };
        firstname: string;
        birthplace: {
          name: string;
        };
        company_id: string;
        created_at: string;
        nationality: string;
        postal_code: string;
        allocated_to: string[];
        normal_hours: number;
        document_type: string;
        street_number: string;
        marital_status: string;
        document_number: string;
        affiliate_status: null | string; // asumí que puede ser null o string
        company_position: string;
        type_of_contract: string;
        workflow_diagram: {
          name: string;
        };
        date_of_admission: string;
        level_of_education: string;
        contractor_employee: {
          contractors: {
            name: string;
            id: string;
          };
        }[];
        hierarchical_position: {
          name: string;
        };
      };
    }[];
  
}

export type singUp = {
  email: string
  password: string
}

export type login = {
  email: string
  password: string
}

export type MotionTransitionProps = {
  children: React.ReactNode;
  className?: string
}

export type BestBussinesData = {
  id: number,
  icon: React.ReactNode,
  title: string,
  description: string
}[]

export type names =
  | 'lastname'
  | 'firstname'
  | 'nationality'
  | 'cuil'
  | 'document_type'
  | 'document_number'
  | 'birthplace'
  | 'gender'
  | 'marital_status'
  | 'level_of_education'
  | 'picture'

export type Employee = {
  id?: string
  lastname: string
  firstname: string
  nationality: string | undefined
  cuil: string //!si
  document_type: string | undefined
  document_number: string //!si
  birthplace: string | undefined
  gender: string | undefined
  marital_status: string | undefined
  level_of_education: string | undefined //!si
  picture?: string | undefined
  street: string
  street_number: string
  province: string | undefined
  city: string | undefined 
  postal_code: string
  phone: string
  email?: string //!si
  file: undefined | null | string | number
  hierarchical_position: string | undefined //!si
  company_position: string //!si
  workflow_diagram: string
  normal_hours: string //!si
  type_of_contract: string | undefined //!si
  allocated_to: string | undefined | string[] //!si
  date_of_admission: Date | undefined | string
  full_name?: string //!si
}
