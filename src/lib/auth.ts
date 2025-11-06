import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Имэйл', type: 'email' },
        password: { label: 'Нууц үг', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Check for test credentials first
          if (credentials.email === 'test@example.com' && credentials.password === 'password') {
            return {
              id: 'test-user-id',
              email: 'test@example.com',
              name: 'Test User',
            }
          }

          // Check database for real users
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user || !user.password) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avatar,
          }
        } catch (error) {
          console.error('Auth error:', error)
          // Fallback to test credentials if database fails
          if (credentials.email === 'test@example.com' && credentials.password === 'password') {
            return {
              id: 'test-user-id',
              email: 'test@example.com',
              name: 'Test User',
            }
          }
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
}