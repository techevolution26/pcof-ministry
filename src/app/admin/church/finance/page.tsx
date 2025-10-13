'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { fetchChurchFinanceSummary } from '@/lib/adminApi'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faRefresh,
  faDownload,
  faPlus,
  faList,
  faSpinner,
  faChartBar,
  faMoneyBillWave,
  faClock,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons'

function fmt(n: number | string | null | undefined, currency?: string) {
    const val = Number(n ?? 0)
    try {
        if (currency) {
            return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(val)
        }
        return new Intl.NumberFormat().format(val)
    } catch {
        return String(val)
    }
}

export default function ChurchFinanceDashboard() {
    const router = useRouter()
    const { user, isLoading } = useAdminAuth()
    const churchId = user?.church_id
    const [summary, setSummary] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [refreshKey, setRefreshKey] = useState(0)

    useEffect(() => {
        let mounted = true
        async function load() {
            setLoading(true)
            setError(null)
            try {
                if (!churchId) {
                    setSummary(null)
                    return
                }
                const s = await fetchChurchFinanceSummary(churchId)
                if (!mounted) return
                setSummary(s)
            } catch (err: any) {
                console.error('finance summary load failed', err)
                if (!mounted) return
                setError(err?.message ?? 'Failed to load finance summary')
                setSummary(null)
            } finally {
                if (mounted) setLoading(false)
            }
        }

        if (!isLoading) load()

        return () => { mounted = false }
    }, [churchId, isLoading, refreshKey])

    if (isLoading) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50 dark:border-gray-700/50">
                    <FontAwesomeIcon icon={faSpinner} className="mx-auto mb-4 text-2xl text-blue-600 animate-spin" />
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Verifying session…</div>
                </div>
            </div>
        </div>
    )

    if (!churchId) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50 dark:border-gray-700/50">
                    <div className="text-red-600 dark:text-red-400 text-center">
                        No church associated with your account. Contact an administrator.
                    </div>
                </div>
            </div>
        </div>
    )

    if (loading) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50 dark:border-gray-700/50">
                    <FontAwesomeIcon icon={faSpinner} className="mx-auto mb-4 text-2xl text-blue-600 animate-spin" />
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Loading finance data…</div>
                </div>
            </div>
        </div>
    )

    if (error) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-red-200/50 dark:border-red-700/50">
                    <div className="text-red-600 dark:text-red-400 text-center">{error}</div>
                </div>
            </div>
        </div>
    )

    if (!summary) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50 dark:border-gray-700/50">
                    <div className="text-gray-600 dark:text-gray-400 text-center">No finance summary available.</div>
                </div>
            </div>
        </div>
    )

    const currencyExample = summary.recent_payments?.[0]?.currency ?? summary.currency ?? 'KES'
    const byType: Array<{ type: string; total: number; count: number }> = Array.isArray(summary.by_type) ? summary.by_type : []
    const maxType = byType.reduce((m, x) => Math.max(m, Number(x.total ?? 0)), 0) || 1
    const recent = Array.isArray(summary.recent_payments) ? summary.recent_payments : []

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.back()}
                                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                                Back
                            </button>
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                            Finance Dashboard
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">
                            Overview for your church ({summary.church_id ?? churchId}) — last {summary.days ?? 30} days
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setRefreshKey(k => k + 1)}
                            className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                            <FontAwesomeIcon icon={faRefresh} className="text-gray-600 dark:text-gray-400" />
                            <span className="text-sm font-medium">Refresh</span>
                        </button>

                        <Link
                            href={`/api/admin/finance/payments/export?church_id=${encodeURIComponent(String(churchId ?? ''))}`}
                            className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                            <FontAwesomeIcon icon={faDownload} className="text-gray-600 dark:text-gray-400" />
                            <span className="text-sm font-medium">Export CSV</span>
                        </Link>

                        <Link 
                            href="/admin/church/finance/payments/new"
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            <span className="text-sm font-medium">Record Payment</span>
                        </Link>

                        <Link 
                            href="/admin/church/finance/payments"
                            className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                            <FontAwesomeIcon icon={faList} className="text-gray-600 dark:text-gray-400" />
                            <span className="text-sm font-medium">View Payments</span>
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50 dark:border-gray-700/50">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                <FontAwesomeIcon icon={faMoneyBillWave} className="text-white text-sm" />
                            </div>
                            <div className="text-xs font-medium text-blue-600 dark:text-blue-400">Total Collections</div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                            {fmt(summary.total_payments ?? summary.total ?? 0, currencyExample)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            {summary.count_payments ?? 0} payments • {summary.days ?? 30} days
                        </div>
                    </div>

                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50 dark:border-gray-700/50">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                                <FontAwesomeIcon icon={faChartBar} className="text-white text-sm" />
                            </div>
                            <div className="text-xs font-medium text-green-600 dark:text-green-400">Tithes</div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                            {fmt(summary.total_tithes ?? 0, currencyExample)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            {summary.count_tithes ?? 0} entries • {summary.days ?? 30} days
                        </div>
                    </div>

                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50 dark:border-gray-700/50">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                                <FontAwesomeIcon icon={faClock} className="text-white text-sm" />
                            </div>
                            <div className="text-xs font-medium text-amber-600 dark:text-amber-400">Pending</div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                            {fmt(summary.pending_collections?.total ?? (summary.pending_collections ?? 0), currencyExample)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            {summary.pending_collections?.count ?? 0} items pending
                        </div>
                    </div>

                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50 dark:border-gray-700/50">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <FontAwesomeIcon icon={faCalendarAlt} className="text-white text-sm" />
                            </div>
                            <div className="text-xs font-medium text-purple-600 dark:text-purple-400">Period Summary</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                Month: {fmt(summary.month_total ?? 0, currencyExample)}
                            </div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                Year: {fmt(summary.year_total ?? 0, currencyExample)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts and Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Payment Type Breakdown */}
                    <div className="lg:col-span-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <FontAwesomeIcon icon={faChartBar} className="text-blue-500" />
                            Payment Types
                        </h3>
                        {byType.length === 0 ? (
                            <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                No breakdown available
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {byType.map((b) => {
                                    const total = Number(b.total ?? 0)
                                    const pct = Math.round((total / maxType) * 100)
                                    return (
                                        <div key={b.type} className="text-sm">
                                            <div className="flex justify-between mb-2">
                                                <div className="capitalize font-medium text-gray-900 dark:text-white">
                                                    {b.type}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {fmt(total, currencyExample)} • {b.count} tx
                                                </div>
                                            </div>
                                            <div className="w-full bg-gray-200/50 dark:bg-gray-700/50 h-2 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-2 rounded-full transition-all duration-500"
                                                    style={{ 
                                                        width: `${pct}%`, 
                                                        background: 'linear-gradient(90deg, #0366d6, #1fb6ff)' 
                                                    }} 
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Recent Activity */}
                    <div className="lg:col-span-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <FontAwesomeIcon icon={faList} className="text-green-500" />
                            Recent Activity
                        </h3>
                        <div className="space-y-3">
                            {recent.length === 0 ? (
                                <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                    No recent payments
                                </div>
                            ) : (
                                recent.slice(0, 8).map((p: any) => (
                                    <div 
                                        key={p.id} 
                                        className="flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-gray-700/50 border border-white/50 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-700 transition-colors duration-200"
                                    >
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900 dark:text-white capitalize">
                                                {p.type ?? 'payment'}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {p.member_name ?? p.member_id ?? '—'} • {p.reference ?? `#${p.id}`}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-gray-900 dark:text-white">
                                                {fmt(p.amount ?? 0, p.currency ?? currencyExample)}
                                            </div>
                                            <div className={`text-xs capitalize ${
                                                p.status === 'approved' ? 'text-green-600 dark:text-green-400' :
                                                p.status === 'pending' ? 'text-amber-600 dark:text-amber-400' :
                                                'text-gray-500 dark:text-gray-400'
                                            }`}>
                                                {p.status ?? 'unknown'}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Note */}
                <div className="text-center">
                    <div className="text-xs text-gray-400 dark:text-gray-500 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-3 border border-white/50 dark:border-gray-700/50">
                        💡 Use the Export CSV button to download detailed payments for reconciliation.
                    </div>
                </div>
            </div>
        </div>
    )
}