// components/AdminShell.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminShell({ children, session }: any) {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-green-50">
      <div className="bg-white border-b border-green-100 p-4 flex justify-between items-center shadow-sm">
        <div className="font-semibold text-slate-800 flex items-center gap-2">
          <span className="text-sky-600">⚙️</span> PCOF Admin
        </div>
        <div className="text-sm text-slate-600">Signed in as {session?.user?.email}</div>
      </div>

      <div className="container mx-auto grid grid-cols-1 md:grid-cols-6 gap-6 py-6 px-4">
        <aside className="md:col-span-1">
          <nav className="flex flex-col gap-2 p-4 bg-white rounded-2xl shadow-md border border-green-100">
            <Link
              href="/admin"
              className={`px-4 py-3 rounded-lg flex items-center gap-2 transition-colors ${isActive('/admin') && !isActive('/admin/churches') && !isActive('/admin/members') && !isActive('/admin/donations') && !isActive('/admin/audit') && !isActive('/admin/settings') ? 'bg-sky-100 text-sky-700' : 'hover:bg-green-50'}`}
            >
              <span>📊</span> Dashboard
            </Link>
            <Link
              href="/admin/churches"
              className={`px-4 py-3 rounded-lg flex items-center gap-2 transition-colors ${isActive('/admin/churches') ? 'bg-sky-100 text-sky-700' : 'hover:bg-green-50'}`}
            >
              <span>⛪</span> Churches
            </Link>
            <Link
              href="/admin/members"
              className={`px-4 py-3 rounded-lg flex items-center gap-2 transition-colors ${isActive('/admin/members') ? 'bg-sky-100 text-sky-700' : 'hover:bg-green-50'}`}
            >
              <span>👥</span> Members
            </Link>
            <Link
              href="/admin/donations"
              className={`px-4 py-3 rounded-lg flex items-center gap-2 transition-colors ${isActive('/admin/donations') ? 'bg-sky-100 text-sky-700' : 'hover:bg-green-50'}`}
            >
              <span>💰</span> Donations
            </Link>
            <Link
              href="/admin/audit"
              className={`px-4 py-3 rounded-lg flex items-center gap-2 transition-colors ${isActive('/admin/audit') ? 'bg-sky-100 text-sky-700' : 'hover:bg-green-50'}`}
            >
              <span>📊</span> Audit Logs
            </Link>
            <Link
              href="/admin/settings"
              className={`px-4 py-3 rounded-lg flex items-center gap-2 transition-colors ${isActive('/admin/settings') ? 'bg-sky-100 text-sky-700' : 'hover:bg-green-50'}`}
            >
              <span>⚙️</span> Settings
            </Link>
          </nav>
        </aside>

        <main className="md:col-span-5">
          {children}
        </main>
      </div>
    </div>
  )
}