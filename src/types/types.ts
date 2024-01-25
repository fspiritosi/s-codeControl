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

export type profile = {
  id?: string
  company_id?: string
  created_at?: string
  firstName: string
  lastName: string
  credentialId: string
  document: string
  birthdate: string
  email: string
}

export type company = {
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
  employees: null
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
  | 'genre'
  | 'marital_status'
  | 'level_of_education'
  | 'picture'