'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAdminSummary, fetchAdminFinanceSummary } from '@/lib/adminApi'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChurch,
  faUsers,
  faMoneyBillWave,
  faClock,
  faSpinner
} from '@fortawesome/free-solid-svg-icons'

function fmt(n?: number) {
  return new Intl.NumberFormat().format(Number(n || 0))
}

export default function DashboardWidgets() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<{
    churches: number
    members: number
    collections_last_30_days: number
    tithes_last_30_days: number
    pending_approvals: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const [adminResp, financeResp] = await Promise.allSettled([
          fetchAdminSummary(),
          fetchAdminFinanceSummary()
        ])

        if (!mounted) return

        const adminData = adminResp.status === 'fulfilled' ? adminResp.value : null
        const finData = financeResp.status === 'fulfilled' ? financeResp.value : null

        const firstRejection = [adminResp, financeResp].find(r => r.status === 'rejected') as PromiseRejectedResult | undefined
        if (firstRejection && firstRejection.reason) {
          const reason = firstRejection.reason as any
          if (reason?.status === 401) {
            router.replace('/admin/login')
            return
          }
          const msg = reason?.message || 'Failed to load dashboard summary'
          setError(msg)
          return
        }

        const churches = Number(
          adminData?.total_churches ??
          adminData?.totalChurches ??
          adminData?.churches ??
          adminData?.total ??
          0
        )

        const members = Number(
          adminData?.total_members ??
          adminData?.totalMembers ??
          adminData?.members ??
          0
        )

        const collections_last_30_days = Number(
          (adminData?.donations_last_30_days ?? adminData?.donations_last_30 ?? adminData?.donations ?? null)
          ?? (financeResp.status === 'fulfilled' ? (finData?.total_payments ?? finData?.totalPayments ?? finData?.total ?? 0) : 0)
        )

        const tithes_last_30_days = Number(
          (adminData?.tithes_last_30_days ?? adminData?.tithes_last_30 ?? adminData?.tithes ?? null)
          ?? (financeResp.status === 'fulfilled' ? (finData?.total_tithes ?? finData?.totalTithes ?? finData?.tithes ?? 0) : 0)
        )

        const pending_approvals = Number(
          adminData?.pending_approvals ??
          adminData?.pendingApprovals ??
          adminData?.pending ??
          0
        )

        const mapped = {
          churches,
          members,
          collections_last_30_days,
          tithes_last_30_days,
          pending_approvals,
        }

        if (mounted) setSummary(mapped)
      } catch (err: any) {
        if (err?.status === 401) {
          router.replace('/admin/login')
          return
        }
        setError(err?.message ?? 'Failed to load dashboard summary')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [router])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
              </div>
              <FontAwesomeIcon icon={faSpinner} className="text-gray-400 animate-spin" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border border-red-200 dark:border-red-800 rounded-2xl p-6 text-red-700 dark:text-red-400">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
            <span className="text-lg">⚠️</span>
          </div>
          <div>
            <div className="font-semibold">Error Loading Data</div>
            <div className="text-sm">{error}</div>
          </div>
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="bg-yellow-50/80 dark:bg-yellow-900/20 backdrop-blur-sm border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6 text-yellow-700 dark:text-yellow-400">
        No summary data available
      </div>
    )
  }

  const widgets = [
    {
      icon: faChurch,
      label: "Total Churches",
      value: summary.churches,
      color: "blue",
      gradient: "from-blue-500 to-blue-600"
    },
    {
      icon: faUsers,
      label: "Total Members",
      value: summary.members,
      color: "green",
      gradient: "from-green-500 to-green-600"
    },
    {
      icon: faMoneyBillWave,
      label: "Collections (30d)",
      value: summary.collections_last_30_days,
      color: "purple",
      gradient: "from-purple-500 to-purple-600"
    },
    {
      icon: faClock,
      label: "Pending Approvals",
      value: summary.pending_approvals,
      color: "orange",
      gradient: "from-orange-500 to-orange-600"
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {widgets.map((widget, index) => (
        <div
          key={widget.label}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 border border-white/50 dark:border-gray-700/50 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                {widget.label}
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {fmt(widget.value)}
              </div>
            </div>
            <div className={`w-14 h-14 bg-gradient-to-br ${widget.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              <FontAwesomeIcon
                icon={widget.icon}
                className="text-white text-xl"
              />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Last updated: Just now
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}