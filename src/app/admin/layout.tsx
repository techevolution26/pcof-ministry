// src/app/admin/layout.tsx
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import AdminShell from "@/components/AdminShell"

export const metadata = { title: "Admin — PCOF" }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user as any)?.role !== "ADMIN") {
    return redirect("/api/auth/signin?callbackUrl=/admin")
  }

  return <AdminShell session={session}>{children}</AdminShell>
}