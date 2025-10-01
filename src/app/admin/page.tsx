'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth' // your hook from earlier
import DashboardWidgets from './dashboard-widgets'

export default function AdminHome() {
  const router = useRouter()
  const { user, isLoading } = useAdminAuth()

  // when verification completes and there's no user, redirect to login
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/admin/login')
    }
  }, [isLoading, user, router])

  // show loader while verifying (avoid flash)
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div
            className="mb-3 mx-auto"
            style={{
              width: 36,
              height: 36,
              border: '3px solid rgba(0,0,0,0.08)',
              borderTopColor: '#6366f1',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }}
          />
          <div className="text-sm text-gray-500">Verifying admin session…</div>

          <style>{`
            @keyframes spin { to { transform: rotate(360deg) } }
          `}</style>
        </div>
      </div>
    )
  }

  // if not loading but user is null we already triggered redirect; render nothing to avoid flash
  if (!user) return null

  // authenticated UI
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin dashboard</h1>
      <DashboardWidgets
        key={user.id} // reset if user changes (login/logout/switch)
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/churches" className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md">
          <div className="text-sm text-gray-500">Churches</div>
          <div className="mt-2 text-2xl font-semibold">Manage churches</div>
        </Link>

        <Link href="/admin/members" className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md">
          <div className="text-sm text-gray-500">Members</div>
          <div className="mt-2 text-2xl font-semibold">Manage members</div>
        </Link>

        <Link href="/admin/finance" className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md">
          <div className="text-sm text-gray-500">Finance</div>
          <div className="mt-2 text-2xl font-semibold">Collections & Tithes</div>
        </Link>
      </div>
    </div>
  )
}
