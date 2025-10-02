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
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div
            role="status"
            aria-live="polite"
            className="mx-auto mb-3 w-9 h-9 rounded-full border-4 border-gray-200 border-t-indigo-600 animate-spin"
          />
          <div className="text-sm text-gray-500 dark:text-gray-400">Verifying admin session…</div>
          <span className="sr-only">Loading</span>
        </div>
      </div>
    )
  }

  // if not loading but user is null we already triggered redirect; render nothing to avoid flash
  if (!user) return null

  // authenticated UI
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100">
              Admin dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage churches, members and finances
            </p>
          </div>
        </header>

        <section className="mb-6">
          <DashboardWidgets key={user.id} />
        </section>

        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
            <Link
              href="/admin/churches"
              className="group block p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200 border border-transparent hover:border-gray-100 dark:hover:border-gray-700"
            >
              <div className="flex flex-col h-full">
                <div className="text-sm text-gray-500 dark:text-gray-400">Churches</div>
                <div className="mt-3 text-2xl font-semibold text-gray-900 dark:text-gray-100">Manage churches</div>
                <div className="mt-auto pt-4">
                  <span className="inline-flex items-center text-indigo-600 dark:text-indigo-400 text-sm font-medium group-hover:underline">
                    Open
                  </span>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/members"
              className="group block p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200 border border-transparent hover:border-gray-100 dark:hover:border-gray-700"
            >
              <div className="flex flex-col h-full">
                <div className="text-sm text-gray-500 dark:text-gray-400">Members</div>
                <div className="mt-3 text-2xl font-semibold text-gray-900 dark:text-gray-100">Manage members</div>
                <div className="mt-auto pt-4">
                  <span className="inline-flex items-center text-indigo-600 dark:text-indigo-400 text-sm font-medium group-hover:underline">
                    Open
                  </span>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/finance"
              className="group block p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200 border border-transparent hover:border-gray-100 dark:hover:border-gray-700"
            >
              <div className="flex flex-col h-full">
                <div className="text-sm text-gray-500 dark:text-gray-400">Finance</div>
                <div className="mt-3 text-2xl font-semibold text-gray-900 dark:text-gray-100">Collections &amp; Tithes</div>
                <div className="mt-auto pt-4">
                  <span className="inline-flex items-center text-indigo-600 dark:text-indigo-400 text-sm font-medium group-hover:underline">
                    Open
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
