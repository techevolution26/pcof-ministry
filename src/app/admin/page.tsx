'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import DashboardWidgets from './dashboard-widgets'
import AdminEventsMini from '@/components/AdminEventsMini'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChurch,
  faUsers,
  faMoneyBillWave,
  faChartLine,
  faSpinner
} from '@fortawesome/free-solid-svg-icons'

export default function AdminHome() {
  const router = useRouter()
  const { user, isLoading } = useAdminAuth()

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'superadmin')) {
      router.replace('/admin/church')
    }
  }, [isLoading, user, router])

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20">
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            className="mx-auto mb-4 text-2xl text-blue-600 animate-spin"
          />
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            Verifying admin session…
          </div>
          <span className="sr-only">Loading</span>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                Admin Dashboard
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 font-light">
                Welcome back, <span className="font-semibold text-blue-600 dark:text-blue-400">{user.name}</span>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
                Manage churches, members, finances, and events across your organization
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-3 shadow-sm">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role?.replace('_', ' ')}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Section */}
        <section className="mb-8">
          <DashboardWidgets key={user.id} />
        </section>

        {/* Calendar Section */}
        <section className="mb-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                <FontAwesomeIcon icon={faChartLine} className="text-blue-500 text-lg" />
                Upcoming Events Calendar
              </h2>
            </div>
            <div className="p-6">
              <AdminEventsMini />
            </div>
          </div>
        </section>

        {/* Quick Actions Grid */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              href="/admin/churches"
              className="group relative bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-800 dark:to-blue-900/20 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border border-blue-100/50 dark:border-blue-800/30 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative p-6 flex flex-col h-full">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FontAwesomeIcon icon={faChurch} className="text-white text-xl" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Churches</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">Manage Churches</div>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 flex-1">
                  View and manage all churches in your organization, including settings and configurations.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-blue-600 dark:text-blue-400 text-sm font-semibold group-hover:underline">
                    Open Dashboard
                  </span>
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/members"
              className="group relative bg-gradient-to-br from-white to-green-50/50 dark:from-gray-800 dark:to-green-900/20 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border border-green-100/50 dark:border-green-800/30 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative p-6 flex flex-col h-full">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FontAwesomeIcon icon={faUsers} className="text-white text-xl" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-green-600 dark:text-green-400">Members</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">Manage Members</div>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 flex-1">
                  Oversee member profiles, registrations, and membership status across all churches.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-green-600 dark:text-green-400 text-sm font-semibold group-hover:underline">
                    Open Dashboard
                  </span>
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition-colors">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/finance"
              className="group relative bg-gradient-to-br from-white to-purple-50/50 dark:from-gray-800 dark:to-purple-900/20 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border border-purple-100/50 dark:border-purple-800/30 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative p-6 flex flex-col h-full">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FontAwesomeIcon icon={faMoneyBillWave} className="text-white text-xl" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-purple-600 dark:text-purple-400">Finance</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">Collections & Tithes</div>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 flex-1">
                  Monitor financial transactions, tithes, collections, and generate financial reports.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-purple-600 dark:text-purple-400 text-sm font-semibold group-hover:underline">
                    Open Dashboard
                  </span>
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-colors">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}