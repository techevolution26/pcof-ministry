'use client'
import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import AdminGuard from './AdminGuard'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faTachometerAlt,
  faChurch,
  faUsers,
  faMoneyBillWave,
  faCalendar,
  faCog,
  faUserShield,
  faSignOutAlt,
  faBars,
  faTimes,
  faHome,
  faUserTie,
  faBuilding,
  faShieldAlt,
  faGripLinesVertical
} from '@fortawesome/free-solid-svg-icons'

type NavItem = { href: string; label: string; section?: string; icon: any }

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ''
  const router = useRouter()

  const { user, isLoading, logout } = useAdminAuth()
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(280) // Reduced default width
  const [isResizing, setIsResizing] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Load sidebar width from localStorage on mount
  useEffect(() => {
    const savedWidth = localStorage.getItem('admin-sidebar-width')
    if (savedWidth) {
      const width = parseInt(savedWidth, 10)
      setSidebarWidth(Math.max(200, Math.min(400, width))) // Enforce min/max
    }
  }, [])

  // Save sidebar width to localStorage
  useEffect(() => {
    localStorage.setItem('admin-sidebar-width', sidebarWidth.toString())
  }, [sidebarWidth])

  // Handle resize mouse events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return

      const newWidth = Math.max(200, Math.min(400, e.clientX)) // Min 200px, Max 400px
      setSidebarWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [isResizing])

  const publicAdminPaths = ['/admin/login', '/admin/register']
  const isPublic = publicAdminPaths.includes(pathname) || pathname.startsWith('/admin/public')

  const nav = useMemo<NavItem[]>(() => {
    function getNavForRole(role?: string, userObj?: any): NavItem[] {
      const common: NavItem[] = []

      const churchAdminOnly: NavItem[] = [
        { href: '/admin/church/members', label: 'Members', section: 'main', icon: faUsers },
        { href: '/admin/church/departments', label: 'Departments', section: 'church', icon: faBuilding },
        { href: '/admin/church/designations', label: 'Designations', section: 'church', icon: faUserTie },
        { href: '/admin/church/finance', label: 'Finance', section: 'church', icon: faMoneyBillWave },
        { href: '/admin/church/finance/reconciliations', label: 'Reconciliation', section: 'church', icon: faShieldAlt },
        { href: '/admin/church/assets', label: 'Assets', section: 'church', icon: faBuilding },
        { href: '/admin/church/ministers', label: 'Ministers', section: 'church', icon: faUserTie },
        { href: '/admin/church/events', label: 'Events', section: 'church', icon: faCalendar },
        { href: '/admin/church/settings', label: 'Settings', section: 'church', icon: faCog },
      ]

      const superadminOnly: NavItem[] = [
        { href: '/admin', label: 'Dashboard', section: 'main', icon: faTachometerAlt },
        { href: '/admin/churches', label: 'Churches', section: 'main', icon: faChurch },
        { href: '/admin/members', label: 'Members', section: 'main', icon: faUsers },
        { href: '/admin/ministers', label: 'Ministers', section: 'main', icon: faUserTie },
        { href: '/admin/finance', label: 'Finance', section: 'main', icon: faMoneyBillWave },
        { href: '/admin/events', label: 'Events', section: 'main', icon: faCalendar },
        { href: '/admin/users', label: 'Users', section: 'admin', icon: faUserShield },
        { href: '/admin/roles', label: 'Roles', section: 'admin', icon: faShieldAlt },
        { href: '/admin/settings', label: 'Settings', section: 'admin', icon: faCog },
      ]

      let navItems: NavItem[] = [...common]

      if (role === 'church_admin' && userObj?.church_id) {
        navItems = [
          { href: `/admin/church`, label: 'My Church', section: 'church', icon: faHome },
          ...navItems
        ]
        navItems = [...navItems, ...churchAdminOnly]
      } else if (role === 'church_admin') {
        navItems = [
          { href: `/admin/church`, label: 'My Church', section: 'church', icon: faHome },
          ...navItems,
          ...churchAdminOnly
        ]
      } else if (role === 'superadmin') {
        navItems = [...navItems, ...superadminOnly]
      } else {
        navItems = [...navItems, ...common]
      }

      const map = new Map<string, NavItem>()
      for (const it of navItems) {
        if (!map.has(it.href)) map.set(it.href, it)
      }
      return Array.from(map.values())
    }

    return getNavForRole(user?.role, user)
  }, [user])

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20">
        <div className="text-center">
          <div className="mb-4 w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mx-auto"></div>
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Verifying admin session…</div>
        </div>
      </div>
    )
  }

  if (isPublic) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20">
        <div className="max-w-3xl mx-auto p-6">{children}</div>
      </main>
    )
  }

  return (
    <AdminGuard>
      <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20">
        {/* Enhanced Resizable Sidebar */}
        <div
          style={{ width: sidebarOpen ? sidebarWidth : 0 }}
          className={`fixed inset-y-0 left-0 z-40 transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } md:translate-x-0`}
        >
          <aside
            style={{ width: sidebarWidth }}
            className="h-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 p-6 overflow-y-auto flex flex-col relative shadow-xl"
          >
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">P</span>
                </div>
                <div>
                  <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    PCOF Admin
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Management Portal</div>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* User Profile Card */}
            <div className="mb-8 p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-100/50 dark:border-blue-800/30">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {user?.name}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 truncate">
                    {user?.email}
                  </div>
                  {user?.role && (
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 capitalize">
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-2 flex-1">
              {nav.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group ${active
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-md'
                      }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <FontAwesomeIcon
                      icon={item.icon}
                      className={`text-lg transition-transform duration-200 group-hover:scale-110 ${active ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                        }`}
                    />
                    <span className="font-medium">{item.label}</span>
                    {active && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </Link>
                )
              })}

              {/* Logout Button */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    try { logout() } catch { /* ignore */ }
                    setSidebarOpen(false)
                    router.replace('/admin/login')
                  }}
                  className="flex items-center gap-4 w-full p-3 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 group"
                >
                  <FontAwesomeIcon
                    icon={faSignOutAlt}
                    className="text-lg group-hover:scale-110 transition-transform duration-200"
                  />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </nav>
          </aside>

          {/* Resize Handle - Outside the scrollable area */}
          <div
            className={`absolute top-0 -right-2 w-4 h-full cursor-col-resize transition-colors duration-200 z-50 ${isResizing ? 'bg-blue-500/20' : 'hover:bg-blue-300/20'
              }`}
            onMouseDown={(e) => {
              e.preventDefault()
              setIsResizing(true)
            }}
          >
            <div className="absolute top-1/2 right-1 transform -translate-y-1/2 w-1 h-16 bg-gray-400 rounded-full opacity-60 hover:opacity-100 transition-opacity"></div>
          </div>
        </div>

        {/* Main Content */}
        <main
          style={{ marginLeft: sidebarOpen ? `${sidebarWidth}px` : '0' }}
          className="flex-1 pt-20 md:pt-8 transition-all duration-300 p-4 md:p-8 min-w-0"
        >
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>

        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Enhanced Mobile Header with Desktop Toggle */}
        <header className="fixed top-0 left-0 right-0 z-30 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 h-16 flex items-center px-4 shadow-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="inline-flex items-center justify-center h-12 w-12 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FontAwesomeIcon
                icon={sidebarOpen ? faTimes : faBars}
                className="text-gray-700 dark:text-gray-300 text-lg"
              />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <div className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PCOF
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-4">
            {/* Desktop Toggle Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <FontAwesomeIcon icon={faGripLinesVertical} />
              <span>{sidebarOpen ? 'Hide' : 'Show'} Sidebar</span>
            </button>

            <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {user?.name}
            </div>
          </div>
        </header>
      </div>
    </AdminGuard>
  )
}