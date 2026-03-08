import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

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
        // For now, delegate to existing profile table lookup
        // Full implementation will replace Supabase auth completely
        if (!credentials?.email || !credentials?.password) return null

        const profile = await prisma.profile.findFirst({
          where: { email: credentials.email as string },
        })

        if (!profile) return null

        // TODO: Implement proper password verification
        // For now return the profile as user
        return {
          id: profile.id,
          email: profile.email,
          name: profile.fullname,
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token?.sub) session.user.id = token.sub
      return session
    },
    async jwt({ token, user }) {
      if (user) token.sub = user.id
      return token
    },
  },
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
})
