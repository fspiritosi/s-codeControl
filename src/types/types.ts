import { UUID } from 'crypto'
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
  avatar: string
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
  employees: UUID
  owner_id: string | undefined
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
  picture: string | undefined
  street: string
  street_number: string
  province: string | undefined
  city: string | undefined 
  postal_code: string
  phone: string
  email: string //!si
  file: File | undefined | string
  hierarchical_position: string | undefined //!si
  company_position: string //!si
  workflow_diagram: string
  normal_hours: string //!si
  type_of_contract: string | undefined //!si
  allocated_to: string | undefined //!si
  date_of_admission: string
  full_name?: string //!si
}
