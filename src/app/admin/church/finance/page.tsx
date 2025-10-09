'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { fetchChurchFinanceSummary } from '@/lib/adminApi'

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

    if (isLoading) return <div className="p-6 text-gray-500">Verifying session…</div>
    if (!churchId) return (
        <div className="p-6 text-gray-600">
            No church associated with your account. Contact an administrator.
        </div>
    )

    if (loading) return <div className="p-6 text-gray-500">Loading finance…</div>
    if (error) return <div className="p-6 text-red-600">{error}</div>
    if (!summary) return <div className="p-6 text-gray-500">No finance summary available.</div>

    const currencyExample = summary.recent_payments?.[0]?.currency ?? summary.currency ?? 'KES'
    const byType: Array<{ type: string; total: number; count: number }> = Array.isArray(summary.by_type) ? summary.by_type : []
    const maxType = byType.reduce((m, x) => Math.max(m, Number(x.total ?? 0)), 0) || 1

    const recent = Array.isArray(summary.recent_payments) ? summary.recent_payments : []

    return (
        <div>
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold">Finance</h1>
                    <div className="text-sm text-gray-500">Overview for your church ({summary.church_id ?? churchId}) — last {summary.days ?? 30} days</div>
                </div>

                <div className="flex gap-2 items-center">
                    <button
                        onClick={() => setRefreshKey(k => k + 1)}
                        className="px-3 py-2 border rounded bg-white hover:bg-slate-50 text-sm"
                    >
                        Refresh
                    </button>

                    <Link
                        href={`/api/admin/finance/payments/export?church_id=${encodeURIComponent(String(churchId ?? ''))}`}
                        className="px-3 py-2 border rounded text-sm"
                    >
                        Export CSV
                    </Link>

                    <Link href="/admin/church/finance/payments/new" className="px-3 py-2 bg-sky-600 text-white rounded text-sm">Record Payment</Link>
                    <Link href="/admin/church/finance/payments" className="px-3 py-2 border rounded text-sm">View Payments</Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-white rounded shadow">
                    <div className="text-xs text-gray-500">Total Collections ({summary.days ?? 30}d)</div>
                    <div className="text-2xl font-bold">{fmt(summary.total_payments ?? summary.total ?? 0, currencyExample)}</div>
                    <div className="text-xs text-gray-400 mt-1">{summary.count_payments ?? ''} payments</div>
                </div>

                <div className="p-4 bg-white rounded shadow">
                    <div className="text-xs text-gray-500">Tithes ({summary.days ?? 30}d)</div>
                    <div className="text-2xl font-bold">{fmt(summary.total_tithes ?? 0, currencyExample)}</div>
                    <div className="text-xs text-gray-400 mt-1">{summary.count_tithes ?? ''} entries</div>
                </div>

                <div className="p-4 bg-white rounded shadow">
                    <div className="text-xs text-gray-500">Pending Collections</div>
                    <div className="text-2xl font-bold">{fmt(summary.pending_collections?.total ?? (summary.pending_collections ?? 0), currencyExample)}</div>
                    <div className="text-xs text-gray-400 mt-1">{summary.pending_collections?.count ?? ''} items</div>
                </div>

                <div className="p-4 bg-white rounded shadow">
                    <div className="text-xs text-gray-500">This month / This year</div>
                    <div className="text-lg font-semibold">{fmt(summary.month_total ?? 0, currencyExample)} /</div>
                    <div className="text-lg font-semibold">{fmt(summary.year_total ?? 0, currencyExample)}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="col-span-1 bg-white rounded shadow p-4">
                    <h3 className="text-sm font-semibold mb-3">By payment type</h3>
                    {byType.length === 0 && <div className="text-sm text-gray-500">No breakdown available</div>}
                    <div className="space-y-3">
                        {byType.map((b) => {
                            const total = Number(b.total ?? 0)
                            const pct = Math.round((total / maxType) * 100)
                            return (
                                <div key={b.type} className="text-sm">
                                    <div className="flex justify-between mb-1">
                                        <div className="capitalize">{b.type}</div>
                                        <div className="text-xs text-gray-500">{fmt(total, currencyExample)} • {b.count} tx</div>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded overflow-hidden">
                                        <div className="h-2 rounded" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #0366d6, #1fb6ff)' }} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="col-span-2 bg-white rounded shadow p-4">
                    <h3 className="text-sm font-semibold mb-3">Recent activity</h3>
                    <div className="space-y-2">
                        {recent.length === 0 && <div className="text-sm text-gray-500">No recent payments</div>}
                        {recent.slice(0, 12).map((p: any) => (
                            <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                                <div>
                                    <div className="font-medium">{(p.type ?? 'payment').toString()} — {p.reference ?? `#${p.id}`}</div>
                                    <div className="text-xs text-gray-500">{p.member_name ?? p.member_id ?? '—'} • {p.created_at ? new Date(p.created_at).toLocaleString() : ''}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold">{fmt(p.amount ?? 0, p.currency ?? currencyExample)}</div>
                                    <div className="text-xs text-gray-400">{p.status ?? ''}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* optional small footer / notes */}
            <div className="text-xs text-gray-400">
                Tip: Use the Export CSV button to download detailed payments for reconciliation.
            </div>
        </div>
    )
}
