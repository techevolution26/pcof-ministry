'use client'
import React from 'react'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChurch,
  faUsers,
  faMoneyBillWave,
  faChartLine
} from '@fortawesome/free-solid-svg-icons'
import DashboardWidgets from './dashboard-widgets'
import AdminEventsMini from '@/components/AdminEventsMini'
import { useAdminAuth } from '@/hooks/useAdminAuth'

export default function AdminHome() {
  const { user } = useAdminAuth()

  if (!user) return null

  return (
    <div className="space-y-8">
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
      <section>
        <DashboardWidgets key={user.id} />
      </section>

      {/* Calendar Section */}
      <section>
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
          <QuickActionCard
            href="/admin/churches"
            title="Manage Churches"
            description="View and manage all churches in your organization, including settings and configurations."
            icon={faChurch}
            color="blue"
          />
          <QuickActionCard
            href="/admin/members"
            title="Manage Members"
            description="Oversee member profiles, registrations, and membership status across all churches."
            icon={faUsers}
            color="green"
          />
          <QuickActionCard
            href="/admin/finance"
            title="Collections & Tithes"
            description="Monitor financial transactions, tithes, collections, and generate financial reports."
            icon={faMoneyBillWave}
            color="purple"
          />
        </div>
      </section>
    </div>
  )
}

// Helper component for quick actions
function QuickActionCard({
  href,
  title,
  description,
  icon,
  color
}: {
  href: string
  title: string
  description: string
  icon: unknown
  color: 'blue' | 'green' | 'purple'
}) {
  const colorClasses = {
    blue: {
      gradient: 'from-blue-500 to-blue-600',
      text: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      hover: 'bg-blue-200 dark:bg-blue-800/50',
      dot: 'bg-blue-600'
    },
    green: {
      gradient: 'from-green-500 to-green-600',
      text: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/30',
      hover: 'bg-green-200 dark:bg-green-800/50',
      dot: 'bg-green-600'
    },
    purple: {
      gradient: 'from-purple-500 to-purple-600',
      text: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      hover: 'bg-purple-200 dark:bg-purple-800/50',
      dot: 'bg-purple-600'
    }
  }

  const classes = colorClasses[color]

  return (
    <Link
      href={href}
      className="group relative bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/20 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-100/50 dark:border-gray-700/30 overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gray-500/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
      <div className="relative p-6 flex flex-col h-full">
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-14 h-14 bg-gradient-to-br ${classes.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
            <FontAwesomeIcon icon={icon} className="text-white text-xl" />
          </div>
          <div className="flex-1">
            <div className={`text-sm font-medium ${classes.text}`}>
              {color === 'blue' ? 'Churches' : color === 'green' ? 'Members' : 'Finance'}
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {title}
            </div>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 flex-1">
          {description}
        </p>
        <div className="flex items-center justify-between">
          <span className={`${classes.text} text-sm font-semibold group-hover:underline`}>
            Open Dashboard
          </span>
          <div className={`w-8 h-8 ${classes.bg} rounded-full flex items-center justify-center group-hover:${classes.hover} transition-colors`}>
            <div className={`w-2 h-2 ${classes.dot} rounded-full`}></div>
          </div>
        </div>
      </div>
    </Link>
  )
}