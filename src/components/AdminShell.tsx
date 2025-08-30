// components/AdminShell.tsx
'use client'
import Link from 'next/link'

export default function AdminShell({ children, session }: any) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b p-4 flex justify-between items-center">
        <div className="font-semibold">PCOF Admin</div>
        <div className="text-sm">Signed in as {session?.user?.email}</div>
      </div>

      <div className="container mx-auto grid grid-cols-1 md:grid-cols-6 gap-6 py-6">
        <aside className="md:col-span-1 space-y-3">
          <nav className="flex flex-col gap-2">
            <Link href="/admin" className="block px-3 py-2 rounded bg-white border">Dashboard</Link>
            <Link href="/admin/churches" className="block px-3 py-2 rounded bg-white border">Churches</Link>
            <Link href="/admin/members" className="block px-3 py-2 rounded bg-white border">Members</Link>
            <Link href="/admin/donations" className="block px-3 py-2 rounded bg-white border">Donations</Link>
            <Link href="/admin/audit" className="block px-3 py-2 rounded bg-white border">Audit Logs</Link>
            <Link href="/admin/settings" className="block px-3 py-2 rounded bg-white border">Settings</Link>
          </nav>
        </aside>

        <main className="md:col-span-5">
          {children}
        </main>
      </div>
    </div>
  )
}
