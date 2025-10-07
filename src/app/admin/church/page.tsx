// app/admin/church/page.tsx
'use client'
import React, { useEffect, useState } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { fetchChurchById, fetchChurchSummary } from '@/lib/adminApi'
import Link from 'next/link'

export default function ChurchDashboardPage() {
    const { user, isLoading } = useAdminAuth()
    const [church, setChurch] = useState<any | null>(null)
    const [summary, setSummary] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const churchId = user?.church_id

    useEffect(() => {
        let mounted = true
        async function load() {
            setLoading(true)
            try {
                if (!churchId) return
                // fetch summary (includes church object and finance + recent items)
                const body = await fetchChurchSummary(churchId)
                if (!mounted) return
                const ch = body?.church ?? (body?.church_id ? await fetchChurchById(churchId) : null)
                setChurch(ch)
                setSummary(body)
            } catch (err) {
                console.error(err)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        if (!isLoading) load()
        return () => { mounted = false }
    }, [churchId, isLoading])

    if (isLoading || loading) {
        return <div className="p-6 text-gray-500">Loading dashboard…</div>
    }

    if (!church) return <div className="p-6 text-red-600">No church found for your account.</div>

    return (
        <div>
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold">{church.name}</h1>
                    <div className="text-sm text-gray-500">{church.address}</div>
                </div>
                <div className="flex gap-2">
                    <Link href={`/admin/church`} className="px-3 py-2 border rounded">View</Link>
                    <Link href={`/admin/church/settings`} className="px-3 py-2 bg-sky-600 text-white rounded">Settings</Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="p-4 bg-white rounded shadow">
                        <div className="text-xs text-gray-500">Members</div>
                        <div className="text-2xl font-bold">{summary?.members_count ?? church?.members_count ?? '—'}</div>
                    </div>
                    <div className="p-4 bg-white rounded shadow">
                        <div className="text-xs text-gray-500">Collections (30d)</div>
                        <div className="text-2xl font-bold">{summary?.payments?.total ?? 0}</div>
                    </div>
                    <div className="p-4 bg-white rounded shadow">
                        <div className="text-xs text-gray-500">Tithes (30d)</div>
                        <div className="text-2xl font-bold">{summary?.tithes?.total ?? 0}</div>
                    </div>
                </div>

                {/* optionally show recent payments */}
                {summary?.recent_payments?.length > 0 && (
                    <section className="bg-white rounded shadow p-4 mt-4">
                        <h3 className="font-semibold mb-2">Recent payments</h3>
                        <ul className="divide-y">
                            {summary.recent_payments.map((p: any) => (
                                <li key={p.id} className="py-2 flex justify-between">
                                    <div className="text-sm">
                                        <div className="font-medium">{p.type ?? 'Payment'} — {p.reference ?? p.id}</div>
                                        <div className="text-xs text-gray-500">{p.member_id ? `Member #${p.member_id}` : '—'} • {new Date(p.created_at).toLocaleString()}</div>
                                    </div>
                                    <div className="font-semibold">{p.amount} {p.currency ?? ''}</div>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}


                <section className="bg-white rounded shadow p-4">
                    <h2 className="text-lg font-semibold mb-3">Quick actions</h2>
                    <div className="flex gap-2">
                        <Link href="/admin/church/members/new" className="px-3 py-2 bg-sky-600 text-white rounded">New member</Link>
                        <Link href="/admin/church/assets/new" className="px-3 py-2 border rounded">Add asset</Link>
                        <Link href="/admin/church/finance/payments/new" className="px-3 py-2 border rounded">Record payment</Link>
                    </div>
                </section>
            </div>
        </div>
    )
}
