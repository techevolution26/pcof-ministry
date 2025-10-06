// src/components/FinanceSummary.tsx
'use client'
import React, { useEffect, useState } from 'react'
import { fetchAdminFinanceSummary } from '@/lib/adminApi'

export default function FinanceSummary({ churchId }: { churchId?: string | number }) {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true
            ; (async () => {
                setLoading(true)
                try {
                    const res = await fetchAdminFinanceSummary(churchId)
                    if (!mounted) return
                    setData(res)
                } catch (err: any) {
                    setError(err?.message ?? 'Failed to load summary')
                } finally {
                    if (mounted) setLoading(false)
                }
            })()
        return () => { mounted = false }
    }, [churchId])

    if (loading) return <div className="p-4 bg-white rounded shadow text-sm">Loading finance summary…</div>
    if (error) return <div className="text-red-600">{error}</div>
    if (!data) return null

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-white rounded shadow">
                <div className="text-sm text-gray-500">Collections (30d)</div>
                <div className="text-xl font-bold">{Number(data.total_payments ?? data.totalPayments ?? 0).toLocaleString()}</div>
            </div>

            <div className="p-3 bg-white rounded shadow">
                <div className="text-sm text-gray-500">Collections Count</div>
                <div className="text-xl font-bold">{Number(data.count_payments ?? data.countPayments ?? 0).toLocaleString()}</div>
            </div>

            <div className="p-3 bg-white rounded shadow">
                <div className="text-sm text-gray-500">Tithes (30d)</div>
                <div className="text-xl font-bold">{Number(data.total_tithes ?? data.totalTithes ?? 0).toLocaleString()}</div>
            </div>

            <div className="p-3 bg-white rounded shadow">
                <div className="text-sm text-gray-500">Tithes Count</div>
                <div className="text-xl font-bold">{Number(data.count_tithes ?? data.countTithes ?? 0).toLocaleString()}</div>
            </div>
        </div>
    )
}
