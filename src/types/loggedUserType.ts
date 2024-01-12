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
