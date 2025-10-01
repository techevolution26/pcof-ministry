// src/components/AdminShell.tsx
'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import AdminGuard from './AdminGuard'
import { useAdminAuth } from '@/hooks/useAdminAuth'

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAdminAuth()
  const [mounted, setMounted] = useState(false)

  // mark mounted so we never show user data on the server-rendered HTML
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <AdminGuard>
      <div className="min-h-screen flex">
        <aside className="w-64 bg-white border-r p-4">
          <div className="mb-6">
            <div className="text-lg font-bold">PCOF Admin</div>
            {/* only show user name after the component is mounted on the client
                and after auth check finished. This prevents SSR mismatch */}
            {mounted && !isLoading && user ? (
              <div className="text-xs text-slate-500">{user?.name ?? ''}</div>
            ) : (
              <div className="text-xs text-slate-400">Signed in</div>
            )}
          </div>

          <nav className="space-y-2">
            <Link href="/admin" className="block p-2 rounded hover:bg-slate-50">Dashboard</Link>
            <Link href="/admin/churches" className="block p-2 rounded hover:bg-slate-50">Churches</Link>
            <Link href="/admin/members" className="block p-2 rounded hover:bg-slate-50">Members</Link>
            <Link href="/admin/finance" className="block p-2 rounded hover:bg-slate-50">Finance</Link>
            <button onClick={() => logout()} className="mt-4 text-sm text-red-600">Sign out</button>
          </nav>
        </aside>

        <main className="flex-1 p-6 bg-slate-50">
          {children}
        </main>
      </div>
    </AdminGuard>
  )
}
