'use client'
import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import AdminGuard from './AdminGuard'
import { useAdminAuth } from '@/hooks/useAdminAuth'

type NavItem = { href: string; label: string; section?: string }

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ''
  const router = useRouter()

  // hooks must be called unconditionally and at top
  const { user, isLoading, logout } = useAdminAuth()
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // identify public pages (no guard)
  const publicAdminPaths = ['/admin/login', '/admin/register']
  const isPublic = publicAdminPaths.includes(pathname) || pathname.startsWith('/admin/public')

  // role-aware nav helper (memoized)
  const nav = useMemo<NavItem[]>(() => {
    function getNavForRole(role?: string, userObj?: any): NavItem[] {
      const common: NavItem[] = [
        // keep common empty or add shared links here
      ]

      const churchAdminOnly: NavItem[] = [
        { href: '/admin/church/members', label: 'Members', section: 'main' },
        { href: '/admin/church/departments', label: 'Departments', section: 'church' },
        { href: '/admin/church/designations', label: 'Designations', section: 'church' },
        { href: '/admin/church/finance', label: 'Finance', section: 'church' },
        { href: '/admin/church/finance/reconciliations', label: 'Reconciliation', section: 'church' },
        { href: '/admin/church/assets', label: 'Assets', section: 'church' },
        { href: '/admin/ministers', label: 'Ministers', section: 'church' },
        { href: '/admin/church/events', label: 'Events', section: 'church' },
        { href: '/admin/church/settings', label: 'Settings', section: 'church' },
      ]

      const superadminOnly: NavItem[] = [
        { href: '/admin', label: 'Dashboard', section: 'main' },
        { href: '/admin/churches', label: 'Churches', section: 'main' },
        { href: '/admin/members', label: 'Members', section: 'main' },
        { href: '/admin/ministers', label: 'Ministers', section: 'main' },
        { href: '/admin/finance', label: 'Finance', section: 'main' },
        { href: '/admin/events', label: 'Events', section: 'main' },
        { href: '/admin/users', label: 'Users', section: 'admin' },
        { href: '/admin/roles', label: 'Roles', section: 'admin' },
        { href: '/admin/settings', label: 'Settings', section: 'admin' },
      ]

      let navItems: NavItem[] = [...common]

      if (role === 'church_admin' && userObj?.church_id) {
        navItems = [
          { href: `/admin/church`, label: 'My Church', section: 'church' },
          ...navItems
        ]
        navItems = [...navItems, ...churchAdminOnly]
      } else if (role === 'church_admin') {
        navItems = [
          { href: `/admin/church`, label: 'My Church', section: 'church' },
          ...navItems,
          ...churchAdminOnly
        ]
      } else if (role === 'superadmin') {
        navItems = [...navItems,...superadminOnly]
      } else {
        // other roles: you can push common or a minimal set
        navItems = [...navItems, ...common]
      }

      // Deduplicate by href, keep first occurrence
      const map = new Map<string, NavItem>()
      for (const it of navItems) {
        if (!map.has(it.href)) map.set(it.href, it)
      }
      return Array.from(map.values())
    }

    return getNavForRole(user?.role, user)
  }, [user])

  // While verifying show a centered loader to avoid hydration mismatch
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mb-3 w-9 h-9 rounded-full border-4 border-gray-200 border-t-indigo-600 animate-spin mx-auto" />
          <div className="text-sm text-gray-500">Verifying admin session…</div>
        </div>
      </div>
    )
  }

  // If this is a public admin page, render children directly (no header/sidebar)
  if (isPublic) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="max-w-3xl mx-auto p-6">{children}</div>
      </main>
    )
  }

  // Protected layout
  return (
    <AdminGuard>
      <div className="min-h-screen flex bg-slate-50">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r p-4 overflow-y-auto transition-transform transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } md:translate-x-0`}
        >
          <div className="mb-6 flex items-center justify-between">
            <div className="text-lg font-bold">PCOF Admin</div>
            <button aria-label="Close" onClick={() => setSidebarOpen(false)} className="md:hidden p-1 rounded hover:bg-slate-100">
              ✕
            </button>
          </div>

          <div className="mb-6 flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-medium">
              {user?.name
                ? user.name
                  .split(' ')
                  .map((n: string) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
                : 'U'}
            </div>
            <div>
              <div className="text-sm font-medium text-slate-800">{user?.name}</div>
              <div className="text-xs text-slate-500">{user?.email}</div>
              {user?.role && <div className="text-xs text-gray-400 mt-1">Role: {user.role}</div>}
              {user?.church_id && <div className="text-xs text-gray-400">Church: {user.church_id}</div>}
            </div>
          </div>

          <nav className="space-y-1 text-sm">
            {nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block p-2 rounded hover:bg-slate-50 ${active ? 'bg-slate-100 font-medium' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.label}
                </Link>
              )
            })}

            <div className="mt-4 border-t pt-3">
              <button
                onClick={() => {
                  try { logout() } catch { /* ignore */ }
                  setSidebarOpen(false)
                  router.replace('/admin/login')
                }}
                className="w-full text-left px-2 py-2 text-sm text-red-600 rounded hover:bg-red-50"
              >
                Sign out
              </button>
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 pt-20 md:pt-6 md:ml-64 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>

        {/* mobile backdrop */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 bg-black/25 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* top header (mobile) */}
        <header className="fixed top-0 left-0 right-0 z-30 bg-white shadow-sm h-16 flex items-center px-4 md:hidden">
          <button aria-label="Open menu" onClick={() => setSidebarOpen(true)} className="mr-3 inline-flex items-center justify-center h-10 w-10 rounded-md hover:bg-slate-100 focus:outline-none">
            <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="text-lg font-semibold">PCOF Admin</div>
          <div className="ml-auto text-sm text-slate-500">{user?.name}</div>
        </header>
      </div>
    </AdminGuard>
  )
}
