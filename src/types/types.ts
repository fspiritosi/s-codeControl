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
<<<<<<< HEAD
  id?: string
  company_id?: string
  created_at?: string
=======
  id?:string
  company_id?: string
  created_at?:string
>>>>>>> dev
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
<<<<<<< HEAD
  city: number
  country: string
  industry: string
  company_logo: string
  province_id: number
  employees: null
=======
  city: string
  country: string
  industry: string
  company_logo: string
>>>>>>> dev
}

export type singUp = {
  email: string
  password: string
}
export type login = {
  email: string
  password: string
}
