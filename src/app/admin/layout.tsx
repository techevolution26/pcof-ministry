// src/app/admin/layout.tsx
import { getServerSession } from "next-auth"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import AdminShell from "@/components/AdminShell"

export const metadata = { title: "Admin — PCOF" }

/**
 * Extend the NextAuth Session user with an optional "role" field.
 * This avoids casting to `any` while remaining defensive about the shape.
 */
type SessionWithRole = Session & {
  user?: Session["user"] & { role?: string }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // getServerSession returns Session | null
  const session = (await getServerSession(authOptions)) as SessionWithRole | null

  // require authenticated admin role
  if (!session || session.user?.role !== "ADMIN") {
    // redirect non-authorized users to signin
    return redirect("/api/auth/signin?callbackUrl=/admin")
  }

  return <AdminShell session={session}>{children}</AdminShell>
}
