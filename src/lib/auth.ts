// src/lib/auth.ts
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"

const providers = [] as any[]

// Credentials provider (dev-friendly admin sign-in)
providers.push(
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "text" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (
        credentials?.email === process.env.ADMIN_EMAIL &&
        credentials?.password === process.env.ADMIN_PASS
      ) {
        return { id: "1", name: "Dev Admin", email: credentials.email, role: "ADMIN" }
      }
      return null
    },
  })
)

// Add Google only if env vars exist — prevents client_id error in dev
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  )
}

export const authOptions: NextAuthOptions = {
  providers,
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role ?? "MEMBER"
      return token
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).role = token.role
      return session
    },
  },
  // required by NextAuth for some internals
  secret: process.env.NEXTAUTH_SECRET,
}
