'use client'
import React, { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import AdminGuard from './AdminGuard'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import AdminSidebar from './AdminSidebar'
// import AdminHeader from './AdminHeader'

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAdminAuth()

  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false) // Start with mini sidebar
  const [sidebarWidth, setSidebarWidth] = useState(280)

  useEffect(() => { setMounted(true) }, [])

  // Load sidebar width from localStorage on mount
  useEffect(() => {
    const savedWidth = localStorage.getItem('admin-sidebar-width')
    if (savedWidth) {
      const width = parseInt(savedWidth, 10)
      setSidebarWidth(Math.max(200, Math.min(400, width)))
    }
  }, [])

  // Save sidebar width to localStorage
  useEffect(() => {
    localStorage.setItem('admin-sidebar-width', sidebarWidth.toString())
  }, [sidebarWidth])

  const publicAdminPaths = ['/admin/login', '/admin/register']
  const isPublic = publicAdminPaths.includes(pathname) || pathname.startsWith('/admin/public')

  const handleLogout = () => {
    try { logout() } catch { /* ignore */ }
    setSidebarOpen(false)
    router.replace('/admin/login')
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20">
        <div className="text-center">
          <div className="mb-4 w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mx-auto"></div>
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Loading...</div>
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
        {/* Sidebar */}
        <AdminSidebar
          isOpen={sidebarOpen}
          width={sidebarWidth}
          onClose={() => setSidebarOpen(false)}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'md:ml-[280px]' : 'md:ml-16'}`}>
          {/* Main Content - Adjusted padding for sticky header */}
          <main className="transition-all duration-300 p-4 md:p-8 min-w-0 pt-20 md:pt-8">
            <div className="max-w-[2000px] mx-auto w-full">{children}</div>
          </main>
        </div>
      </div>
    </AdminGuard>
  )
}
