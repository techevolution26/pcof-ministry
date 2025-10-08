'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { fetchChurchFinanceSummary } from '@/lib/adminApi'

export default function ChurchFinanceDashboard() {
    const { user, isLoading } = useAdminAuth()
    const churchId = user?.church_id
    const [summary, setSummary] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        async function load() {
            setLoading(true)
            try {
                if (!churchId) return
                const s = await fetchChurchFinanceSummary(churchId)
                if (!mounted) return
                setSummary(s)
            } catch (err) { console.error(err) }
            finally { if (mounted) setLoading(false) }
        }
        if (!isLoading) load()
        return () => { mounted = false }
    }, [churchId, isLoading])

    if (isLoading || loading) return <div className="p-6">Loading finance…</div>
    if (!summary) return <div className="p-6 text-gray-500">No summary</div>

    return (
        <div>
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold">Finance</h1>
                    <div className="text-sm text-gray-500">Overview for your church</div>
                </div>

                <div className="flex gap-2">
                    <Link href="/admin/church/finance/payments/new" className="px-3 py-2 bg-sky-600 text-white rounded">Record Payment</Link>
                    <Link href="/admin/church/finance/payments" className="px-3 py-2 border rounded">View Payments</Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-white rounded shadow">
                    <div className="text-xs text-gray-500">Total Collections (30d)</div>
                    <div className="text-2xl font-bold">{summary.total_payments ?? summary.total ?? 0}</div>
                </div>

                <div className="p-4 bg-white rounded shadow">
                    <div className="text-xs text-gray-500">Tithes (30d)</div>
                    <div className="text-2xl font-bold">{summary.total_tithes ?? 0}</div>
                </div>

                <div className="p-4 bg-white rounded shadow">
                    <div className="text-xs text-gray-500">Pending Collections</div>
                    <div className="text-2xl font-bold">{summary.pending_collections ?? 0}</div>
                </div>
            </div>

            <section className="bg-white rounded shadow p-4">
                <h2 className="text-lg font-semibold mb-3">Recent activity</h2>
                {(summary.recent_payments || []).slice(0, 8).map((p: any) =>
                    <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div>
                            <div className="font-medium">{p.type} — {p.reference ?? `#${p.id}`}</div>
                            <div className="text-xs text-gray-500">{p.member_name ?? p.member_id ?? '—'} • {new Date(p.created_at).toLocaleString()}</div>
                        </div>
                        <div className="font-semibold">{p.amount} {p.currency ?? ''}</div>
                    </div>
                )}
            </section>
        </div>
    )
}
