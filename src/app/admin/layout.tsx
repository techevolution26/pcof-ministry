// src/app/admin/layout.tsx
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import AdminShell from "@/components/AdminShell"

export const metadata = { title: "Admin — PCOF" }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // getServerSession needs the same authOptions used by the NextAuth route
  const session = await getServerSession(authOptions)

  // if no session -> redirect to sign-in (NextAuth provides the page)
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return redirect("/api/auth/signin?callbackUrl=/admin")
  }

  return <AdminShell session={session}>{children}</AdminShell>
}
