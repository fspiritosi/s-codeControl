import type {} from '@auth/core/jwt'
import NextAuth from 'next-auth'
import type { DefaultSession } from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/shared/lib/prisma'
import bcrypt from 'bcryptjs'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      profileId: string
      companyId: string | null
    } & DefaultSession['user']
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    role?: string
    profileId?: string
    companyId?: string | null
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email as string
        const password = credentials.password as string

        const profile = await prisma.profile.findFirst({
          where: { email: { equals: email, mode: 'insensitive' } },
        })

        if (!profile?.password_hash) return null

        const valid = await bcrypt.compare(password, profile.password_hash)
        if (!valid) return null

        await prisma.profile.update({
          where: { id: profile.id },
          data: { last_sign_in_at: new Date() },
        })

        return {
          id: profile.id,
          email: profile.email ?? '',
          name: profile.fullname ?? '',
        }
      },
    }),
  ],
  callbacks: {
    // Login con Google: crea el profile la primera vez (antes lo hacía el trigger
    // create_user_for_external_login sobre auth.users de Supabase).
    async signIn({ account, profile: oauthProfile, user }) {
      if (account?.provider !== 'google') return true
      const email = (oauthProfile?.email ?? user.email)?.toLowerCase()
      if (!email) return false

      const existing = await prisma.profile.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: { id: true },
      })
      if (!existing) {
        const id = crypto.randomUUID()
        await prisma.profile.create({
          data: {
            id,
            credential_id: id,
            email,
            fullname: oauthProfile?.name ?? user.name ?? null,
            avatar: oauthProfile?.picture ?? user.image ?? null,
            role: 'CodeControlClient',
            email_verified_at: new Date(),
          },
        })
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        const profile = await prisma.profile.findFirst({
          where: { email: { equals: user.email!, mode: 'insensitive' } },
        })
        if (profile) {
          token.role = profile.role ?? undefined
          token.profileId = profile.id

          // Get primary company (owned)
          const company = await prisma.company.findFirst({
            where: { owner_id: profile.id },
          })
          token.companyId = company?.id ?? null
        }
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = (token.profileId as string) ?? token.sub!
      session.user.role = (token.role as string) ?? ''
      session.user.profileId = (token.profileId as string) ?? ''
      session.user.companyId = (token.companyId as string | null) ?? null
      return session
    },
  },
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
})
