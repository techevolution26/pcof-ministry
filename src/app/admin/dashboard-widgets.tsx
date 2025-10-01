// src/app/admin/dashboard-widgets.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAdminSummary, fetchAdminFinanceSummary } from '@/lib/adminApi'

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
        // call both endpoints in parallel
        const [adminResp, financeResp] = await Promise.allSettled([
          fetchAdminSummary(),
          fetchAdminFinanceSummary()
        ])

        if (!mounted) return

        const adminData = adminResp.status === 'fulfilled' ? adminResp.value : null
        const finData = financeResp.status === 'fulfilled' ? financeResp.value : null

        // debug: show raw payloads in console
        // remove these logs in production
        // eslint-disable-next-line no-console
        console.debug('[dashboard] adminData', adminData)
        // eslint-disable-next-line no-console
        console.debug('[dashboard] finData', finData)

        // If either was rejected, inspect reason and show an error or redirect on 401
        const firstRejection = [adminResp, financeResp].find(r => r.status === 'rejected') as PromiseRejectedResult | undefined
        if (firstRejection && firstRejection.reason) {
          const reason = firstRejection.reason as any
          // if auth problem -> go back to login
          if (reason?.status === 401) {
            // api wrapper should clear token; redirect user
            router.replace('/admin/login')
            return
          }
          // show backend error message if any
          const msg = reason?.message || (reason?.response && JSON.stringify(reason.response)) || 'Failed to load dashboard summary'
          setError(msg)
          return
        }

        // Normalize/backend mapping safely (parentheses to avoid precedence problems)
        // prefer: adminData.total_churches OR adminData.churches OR adminData.totalChurches
        const churches = Number(
          adminData?.total_churches ??
          adminData?.totalChurches ??
          adminData?.churches ??
          adminData?.total ?? // some endpoints use total
          0
        )

        const members = Number(
          adminData?.total_members ??
          adminData?.totalMembers ??
          adminData?.members ??
          0
        )

        // collections_last_30_days:
        // if adminData has explicit donations_last_30_days use that else fall back to finance response
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

  if (loading) return <div className="text-sm text-gray-500">Loading summary…</div>
  if (error) return <div className="text-red-600">{error}</div>
  if (!summary) return <div className="text-sm text-gray-500">No summary available</div>

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="text-sm text-gray-500">Total Churches</div>
        <div className="text-2xl font-bold">{fmt(summary.churches)}</div>
      </div>

      <div className="p-4 bg-white rounded-lg shadow">
        <div className="text-sm text-gray-500">Members</div>
        <div className="text-2xl font-bold">{fmt(summary.members)}</div>
      </div>

      <div className="p-4 bg-white rounded-lg shadow">
        <div className="text-sm text-gray-500">Collections (30d)</div>
        <div className="text-2xl font-bold">{fmt(summary.collections_last_30_days)}</div>
      </div>

      <div className="p-4 bg-white rounded-lg shadow">
        <div className="text-sm text-gray-500">Pending Approvals</div>
        <div className="text-2xl font-bold">{fmt(summary.pending_approvals)}</div>
      </div>
    </div>
  )
}
