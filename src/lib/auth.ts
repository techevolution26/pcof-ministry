// src/lib/auth.ts
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"

const providers: Array<
  ReturnType<typeof CredentialsProvider> | ReturnType<typeof GoogleProvider>
> = []

// Credentials provider (dev-friendly admin sign-in)
providers.push(
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "text" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials: { email?: string; password?: string } | undefined) {
      // explicit guard so TypeScript narrows `credentials`
      if (
        credentials &&
        credentials.email === process.env.ADMIN_EMAIL &&
        credentials.password === process.env.ADMIN_PASS
      ) {
        const email = credentials.email! // safe after guard
        return { id: "1", name: "Dev Admin", email, role: "ADMIN" }
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
      // `user` shape can vary — narrow to object and check for `role`
      if (user && typeof user === "object" && user !== null) {
        // cast via `unknown` first to avoid incompatible-type cast errors
        const u = user as unknown as Record<string, unknown>
        if (typeof u.role === "string") {
          ; (token as Record<string, unknown>).role = u.role
        }
      }

      // ensure token has a role fallback
      if (typeof (token as Record<string, unknown>).role !== "string") {
        ; (token as Record<string, unknown>).role = "MEMBER"
      }

      return token
    },
    async session({ session, token }) {
      if (session.user && typeof session.user === "object" && session.user !== null) {
        // copy role from token onto session.user for convenience in the app
        ; (session.user as unknown as Record<string, unknown>).role = (token as Record<string, unknown>).role
      }
      return session
    },
  },
  // required by NextAuth for some internals
  secret: process.env.NEXTAUTH_SECRET,
}
