export type User = {
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

export type profile = {
  firstName: string
  lastName: string
  credentialId: string | undefined
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
  city: string
  country: string
  industry: string
  company_logo: string
}

export type singUp = {
  email: string
  password: string
}
export type login = {
  email: string
  password: string
}
