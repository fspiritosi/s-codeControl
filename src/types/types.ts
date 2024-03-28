import React from 'react'

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
  firstname: string
  lastname: string
  credential_id: string
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
  city: {
    id: number
    name: string
  }
  country: string
  industry: string
  company_logo: string
  province_id: {
    id: number
    name: string
  }
  by_defect: boolean
  owner_id: string | undefined
}

export type industry_type = {
  id: number
  name: string
}[]

export type companyData = {
  id: string
  company_name: string
  description: string
  website: string
  contact_email: string
  contact_phone: string
  address: string
  by_defect: boolean
  city: {
    name: string
    id: number
  }
  country: string
  industry: string
  company_logo: string
  is_active?: boolean
  company_cuit: string
  province_id: {
    name: string
    id: number
  }
  owner_id: string
  companies_employees: {
    employees: {
      id: string
      city: {
        name: string
      }
      cuil: string
      file: string
      email: string
      phone: string
      gender: string
      street: string
      picture: string
      lastname: string
      province: {
        name: string
      }
      firstname: string
      birthplace: {
        name: string
      }
      company_id: string
      created_at: string
      nationality: string
      postal_code: string
      allocated_to: string[]
      normal_hours: number
      document_type: string
      street_number: string
      marital_status: string
      document_number: string
      affiliate_status: null | string // asumí que puede ser null o string
      company_position: string
      type_of_contract: string
      workflow_diagram: {
        name: string
      }
      is_active: boolean
      date_of_admission: string
      level_of_education: string
      reason_for_termination: string
      termination_date: string
      contractor_employee: {
        contractors: {
          name: string
          id: string
        }
      }[]
      hierarchical_position: {
        name: string
      }
    }
  }[]
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
  children: React.ReactNode
  className?: string
}

export type BestBussinesData = {
  id: number
  icon: React.ReactNode
  title: string
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
  allocated_to?: string | undefined | string[] //!si
  date_of_admission: Date | undefined | string
  full_name?: string //!si
  is_active?: boolean
  reason_for_termination?: string | undefined
  termination_date?: Date | undefined | string
  status?: 'Avalado' | 'No avalado'
}

export type Documents = {
  id:string
  id_storage: string | null
  id_document_types: string | null
  applies:string | null
  validity:Date | null
  state:string
  is_active: boolean
  user_id: string | undefined
  document_url: string | null
}

export type TypeOfVehicle ={
  id: string
  name: string
  created_at: string
}
export type Brand ={
  id: string
  name: string
  created_at: string
}
export type Model ={
  id: string
  name: string
  created_at: string
}

export type Vechicle = {
  id: string
  created_at: string
  picture: string
  type_of_vehicle: TypeOfVehicle
  domain: string
  chassis: string
  engine: string
  serie: string
  intern_number: string
  year: string
  brand: Brand
  model: Model
  company_id: string
  is_active: boolean
  termination_date: string
  reason_for_termination: string
  user_id: string
  status: 'Avalado' | 'No avalado'
  type: Model
}

type Resource = Vechicle | Employee

type DocumentType = {
  id: string
  name: string
  description: string
  applies: 'Equipos' | 'Persona'
  multiresource: boolean
  mandatory: boolean
  expired: boolean
  special: boolean
  is_active: boolean
  created_at: string
}

type Document = {
  id: string
  created_at: string
  id_storage: string
  id_document_types: DocumentType
  validity: string
  state: 'presentado' | 'rechazado' | 'aprobado' | 'vencido'
  is_active: boolean
  user_id: string
  applies: Resource
  document_url: string
}

export const AllDocuments: Document[] = [
  {
    id: "1",
    created_at: "2022-01-01",
    id_storage: "abc123",
    id_document_types: {
      id: "1",
      name: "Passport",
      description: "Travel document",
      applies: "Persona",
      multiresource: false,
      mandatory: true,
      expired: true,
      special: false,
      is_active: true,
      created_at: "2022-01-01",
    },
    validity: "2023-01-01",
    state: "presentado",
    is_active: true,
    user_id: "123",
    applies: {
      id: "1",
      lastname: "Doe",
      firstname: "John",
      nationality: "USA",
      cuil: "123456789",
      document_type: "Passport",
      document_number: "ABC123",
      birthplace: "New York",
      gender: "Male",
      marital_status: "Single",
      level_of_education: "Bachelor's Degree",
      picture: "https://example.com/johndoe.jpg",
      street: "123 Main St",
      street_number: "123",
      province: "New York",
      city: "New York City",
      postal_code: "12345",
      phone: "123-456-7890",
      email: "johndoe@example.com",
      file: null,
      hierarchical_position: "Manager",
      company_position: "Software Engineer",
      workflow_diagram: "Diagram 1",
      normal_hours: "40",
      type_of_contract: "Full-time",
      allocated_to: ["Project A", "Project B"],
      date_of_admission: "2022-01-01",
      is_active: true,
      reason_for_termination: "Resigned",
      termination_date: "2023-01-01",
      status: "Avalado",
    },
    document_url: "https://example.com/document.pdf",
  },
  {
    id: "2",
    created_at: "2022-02-01",
    id_storage: "def456",
    id_document_types: {
      id: "2",
      name: "Driver's License",
      description: "Driving document",
      applies: "Persona",
      multiresource: false,
      mandatory: true,
      expired: true,
      special: false,
      is_active: true,
      created_at: "2022-02-01",
    },
    validity: "2023-02-01",
    state: "rechazado",
    is_active: true,
    user_id: "456",
    applies: {
      id: '2',
      created_at: '2022-02-01',
  picture: 'https://example.com/vehicle.jpg',
  type_of_vehicle: {name: 'Car', id: '1', created_at: '2022-02-01'},
  domain: 'ABC123',
  chassis: '123456789',
  engine: 'ABC123',
  serie: 'ABC123',
  intern_number: '123',
  year: '2022',
  brand:  {name: 'Toyota', id: '1', created_at: '2022-02-01'},
  model: {name: 'Corolla', id: '1', created_at: '2022-02-01'},
  company_id: '123',
  is_active: true,
  termination_date:   '2023-02-01',
  reason_for_termination:   'Sold',
  user_id:  '456',
  status: 'Avalado',
  type: {name: 'Corolla', id: '1', created_at: '2022-02-01'},
    },
    document_url: "https://example.com/document.pdf",
  },
  // Add more examples here...
];

export type AuditorDocument = {
  date: string
  companyName: string
  allocated_to: string
  documentName: string
  multiresource: string
  validity: string
  id: string
  resource: string
  state: string
}

export type VehiclesAPI = {
  created_at:        Date;
  id_storage:        null;
  id_document_types: string;
  applies:           Applies;
  validity:          null;
  state:             string;
  is_active:         boolean;
  id:                string;
  user_id:           string;
  document_url:      string;
  document_types:    DocumentTypes;
}

export type Applies = {
  id:                     string;
  type:                   Type;
  year:                   string;
  brand:                  Brand;
  model:                  Brand;
  serie:                  string;
  domain:                 string;
  engine:                 string;
  status:                 string;
  chassis:                string;
  picture:                string;
  user_id:                string;
  is_active:              boolean;
  company_id:             string;
  created_at:             Date;
  intern_number:          string;
  type_of_vehicle:        Brand;
  termination_date:       null;
  reason_for_termination: null;
}

export type Type = {
  id:         string;
  name:       string;
  created_at: Date;
}

export type DocumentTypes = {
  id:            string;
  name:          string;
  applies:       string;
  special:       boolean;
  explired:      boolean;
  is_active:     boolean;
  mandatory:     boolean;
  created_at:    Date;
  description:   null;
  multiresource: boolean;
}
