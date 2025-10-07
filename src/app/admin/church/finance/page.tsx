// app/admin/church/finance/page.tsx
'use client'
import React, { useEffect, useState } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { fetchChurchFinanceSummary, fetchChurchPayments } from '@/lib/adminApi'
import Link from 'next/link'

export default function ChurchFinancePage() {
    const { user, isLoading } = useAdminAuth()
    const churchId = user?.church_id
    const [summary, setSummary] = useState<any>(null)
    const [payments, setPayments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        async function load() {
            setLoading(true)
            try {
                if (!churchId) return
                const [s, p] = await Promise.all([fetchChurchFinanceSummary(churchId), fetchChurchPayments(churchId)])
                if (!mounted) return
                setSummary(s)
                setPayments(Array.isArray(p) ? p : (p?.data ?? []))
            } catch (err) {
                console.error(err)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        if (!isLoading) load()
        return () => { mounted = false }
    }, [churchId, isLoading])

    if (isLoading || loading) return <div className="p-6 text-gray-500">Loading finance…</div>

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-lg font-semibold">Finance</h1>
                <Link href="/admin/church/finance/payments/new" className="px-3 py-1 bg-sky-600 text-white rounded text-sm">Record payment</Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-4 bg-white rounded shadow"><div className="text-xs text-gray-500">Total (30d)</div><div className="text-2xl font-bold">{summary?.total_payments ?? 0}</div></div>
                <div className="p-4 bg-white rounded shadow"><div className="text-xs text-gray-500">Tithes (30d)</div><div className="text-2xl font-bold">{summary?.total_tithes ?? 0}</div></div>
                <div className="p-4 bg-white rounded shadow"><div className="text-xs text-gray-500">Pending</div><div className="text-2xl font-bold">{summary?.pending ?? 0}</div></div>
            </div>

            <div className="bg-white rounded shadow p-4">
                <h2 className="text-lg font-semibold mb-3">Recent payments</h2>
                <div className="overflow-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-xs text-gray-500"><tr><th className="p-2">#</th><th className="p-2">Type</th><th className="p-2">Amount</th><th className="p-2">Date</th></tr></thead>
                        <tbody>
                            {payments.map(p => (
                                <tr key={p.id} className="border-t">
                                    <td className="p-2">{p.id}</td>
                                    <td className="p-2">{p.type ?? '—'}</td>
                                    <td className="p-2">{p.amount}</td>
                                    <td className="p-2">{p.created_at ?? p.createdAt}</td>
                                </tr>
                            ))}
                            {payments.length === 0 && <tr><td colSpan={4} className="p-4 text-gray-500">No payments found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
