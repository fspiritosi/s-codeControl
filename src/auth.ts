import NextAuth from 'next-auth'
import type { DefaultSession } from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { supabaseServer } from '@/lib/supabase/server'

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
  adapter: PrismaAdapter(prisma),
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
          where: { email },
        })

        if (!profile) return null

        // Strategy 1: Profile has password_hash — verify with bcrypt
        if (profile.password_hash) {
          const valid = await bcrypt.compare(password, profile.password_hash)
          if (!valid) return null

          return {
            id: profile.id,
            email: profile.email ?? '',
            name: profile.fullname ?? '',
          }
        }

        // Strategy 2: No password_hash — fallback to Supabase signInWithPassword
        // and transparently migrate the password hash
        try {
          const supabase = await supabaseServer()
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (error) return null

          // Transparent migration: hash the password and save to profile
          const hashedPassword = await bcrypt.hash(password, 12)
          await prisma.profile.update({
            where: { id: profile.id },
            data: { password_hash: hashedPassword },
          })

          return {
            id: profile.id,
            email: profile.email ?? '',
            name: profile.fullname ?? '',
          }
        } catch {
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const profile = await prisma.profile.findFirst({
          where: { email: user.email! },
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
      session.user.id = token.sub!
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
