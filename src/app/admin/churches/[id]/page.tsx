// src/app/admin/churches/[id]/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    fetchChurchById,
    fetchChurchMembers,
    fetchChurchAssets,
    fetchChurchEvents,
    fetchChurchPayments,
    fetchChurchFinanceSummary,
} from '@/lib/adminApi'

type Church = { id: number | string; name?: string; address?: string; pastor?: string; description?: string;[k: string]: any }

export default function ChurchShowPage() {
    const params = useParams()
    const rawId = params?.id
    // normalize next.js route param (can be string | string[] | undefined) into string | number | undefined
    const idStr = Array.isArray(rawId) ? rawId[0] : rawId
    const id = idStr != null && idStr !== '' && !Number.isNaN(Number(idStr)) ? Number(idStr) : idStr
    const router = useRouter()

    const [church, setChurch] = useState<Church | null>(null)
    const [loadingChurch, setLoadingChurch] = useState(true)
    const [activeTab, setActiveTab] = useState<'members' | 'assets' | 'events' | 'collections'>('members')

    useEffect(() => {
        let mounted = true
        if (!id) {
            // nothing to load when id is absent; ensure cleanup is possible
            return () => { mounted = false }
        }
        setLoadingChurch(true)
        fetchChurchById(id)
            .then((body: any) => {
                if (!mounted) return
                // backend might return { data: { ... } } or the object directly
                const data = body?.data ?? body?.church ?? body
                setChurch(data || null)
            })
            .catch((err) => {
                // redirect on auth problems (apiGet clears token but we'll redirect)
                if (err?.status === 401 || err?.status === 403) router.replace('/admin/login')
                else console.error('Failed to load church', err)
            })
            .finally(() => { if (mounted) setLoadingChurch(false) })
        return () => { mounted = false }
    }, [id, router])

    if (id == null) return <div>Invalid church id</div>
    if (loadingChurch) return <div>Loading church…</div>
    if (!church) return <div className="text-red-600">Church not found.</div>

    return (
        <div>
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">{church.name}</h1>
                    <div className="text-sm text-slate-600">{church.pastor ?? '—'}</div>
                    {church.address && <div className="text-xs text-slate-500 mt-1">{church.address}</div>}
                </div>
                <div className="flex items-center gap-2">
                    <Link href={`/admin/churches/${id}/edit`} className="px-3 py-2 bg-sky-600 text-white rounded">Edit</Link>
                    <Link href="/admin/churches" className="px-3 py-2 border rounded">Back</Link>
                </div>
            </div>

            <div className="mb-4">
                <nav className="flex gap-2">
                    {(['members', 'assets', 'events', 'collections'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3 py-2 rounded ${activeTab === tab ? 'bg-sky-600 text-white' : 'bg-white border'}`}
                        >
                            {tab[0].toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </nav>
            </div>

            <div>
                {activeTab === 'members' && <MembersTab churchId={id} />}
                {activeTab === 'assets' && <AssetsTab churchId={id} />}
                {activeTab === 'events' && <EventsTab churchId={id} />}
                {activeTab === 'collections' && <CollectionsTab churchId={id} />}
            </div>
        </div>
    )
}

/* ----------------------- Tab components ----------------------- */

function normalizeList(body: any) {
    if (!body) return []
    if (Array.isArray(body)) return body
    if (Array.isArray(body?.data)) return body.data
    if (Array.isArray(body?.items)) return body.items
    // Some endpoints return { results: [...] }
    if (Array.isArray(body?.results)) return body.results
    return []
}

/** Members tab */
function MembersTab({ churchId }: { churchId: string | number }) {
    const [list, setList] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true
        setLoading(true); setError(null)
        fetchChurchMembers(churchId)
            .then(body => { if (!mounted) return; setList(normalizeList(body)) })
            .catch((err) => { if (!mounted) return; setError(err?.message ?? 'Failed to load members') })
            .finally(() => { if (mounted) setLoading(false) })
        return () => { mounted = false }
    }, [churchId])

    if (loading) return <div>Loading members…</div>
    if (error) return <div className="text-red-600">{error}</div>

    return (
        <div className="bg-white rounded shadow p-4">
            <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-semibold">Members ({list.length})</div>
                <Link href={`/admin/members/new?church_id=${churchId}`} className="px-3 py-1 bg-sky-600 text-white rounded text-sm">Add member</Link>
            </div>
            <div className="overflow-auto">
                <table className="w-full text-left text-sm">
                    <thead className="text-xs text-gray-500">
                        <tr>
                            <th className="p-2">#</th>
                            <th className="p-2">Name</th>
                            <th className="p-2">Phone</th>
                            <th className="p-2">Assembly</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.map((m: any) => (
                            <tr key={m.id} className="border-t">
                                <td className="p-2">{m.member_number ?? m.id}</td>
                                <td className="p-2">{m.first_name} {m.last_name}</td>
                                <td className="p-2">{m.phone ?? '—'}</td>
                                <td className="p-2">{m.assembly?.name ?? m.assembly_id ?? '—'}</td>
                            </tr>
                        ))}
                        {list.length === 0 && <tr><td colSpan={4} className="p-4 text-gray-500">No members found.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

/** Assets tab */
function AssetsTab({ churchId }: { churchId: string | number }) {
    const [list, setList] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true
        setLoading(true); setError(null)
        fetchChurchAssets(churchId)
            .then(body => { if (!mounted) return; setList(normalizeList(body)) })
            .catch((err) => { if (!mounted) return; setError(err?.message ?? 'Failed to load assets') })
            .finally(() => { if (mounted) setLoading(false) })
        return () => { mounted = false }
    }, [churchId])

    if (loading) return <div>Loading assets…</div>
    if (error) return <div className="text-red-600">{error}</div>

    return (
        <div className="bg-white rounded shadow p-4">
            <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-semibold">Assets ({list.length})</div>
                <Link href={`/admin/assets/new?church_id=${churchId}`} className="px-3 py-1 bg-sky-600 text-white rounded text-sm">Add asset</Link>
            </div>

            <div className="overflow-auto">
                <table className="w-full text-left text-sm">
                    <thead className="text-xs text-gray-500">
                        <tr>
                            <th className="p-2">Tag</th>
                            <th className="p-2">Name</th>
                            <th className="p-2">Location</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.map((a: any) => (
                            <tr key={a.id} className="border-t">
                                <td className="p-2">{a.asset_tag ?? '—'}</td>
                                <td className="p-2">{a.name ?? '—'}</td>
                                <td className="p-2">{a.location ?? '—'}</td>
                            </tr>
                        ))}
                        {list.length === 0 && <tr><td colSpan={3} className="p-4 text-gray-500">No assets found.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

/** Events tab */
function EventsTab({ churchId }: { churchId: string | number }) {
    const [list, setList] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true
        setLoading(true); setError(null)
        fetchChurchEvents(churchId)
            .then(body => { if (!mounted) return; setList(normalizeList(body)) })
            .catch((err) => { if (!mounted) return; setError(err?.message ?? 'Failed to load events') })
            .finally(() => { if (mounted) setLoading(false) })
        return () => { mounted = false }
    }, [churchId])

    if (loading) return <div>Loading events…</div>
    if (error) return <div className="text-red-600">{error}</div>

    return (
        <div className="bg-white rounded shadow p-4">
            <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-semibold">Events ({list.length})</div>
                <Link href={`/admin/events/new?church_id=${churchId}`} className="px-3 py-1 bg-sky-600 text-white rounded text-sm">Create event</Link>
            </div>

            <div className="space-y-3">
                {list.map((e: any) => (
                    <div key={e.id} className="p-3 border rounded">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium">{e.title ?? e.name}</div>
                                <div className="text-xs text-slate-500">{e.starts_at ?? e.startsAt ?? e.start_date ?? ''}</div>
                            </div>
                            <Link href={`/admin/events/${e.id}`} className="text-sky-600">View</Link>
                        </div>
                        {e.location && <div className="text-sm text-slate-600 mt-2">{e.location}</div>}
                    </div>
                ))}
                {list.length === 0 && <div className="p-4 text-gray-500">No events found.</div>}
            </div>
        </div>
    )
}

/** Collections / Payments tab */
function CollectionsTab({ churchId }: { churchId: string | number }) {
    const [payments, setPayments] = useState<any[]>([])
    const [summary, setSummary] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true
        setLoading(true); setError(null)

        Promise.allSettled([
            fetchChurchPayments(churchId),
            fetchChurchFinanceSummary(churchId)
        ])
            .then(results => {
                if (!mounted) return
                const paymentsRes = results[0]
                const summaryRes = results[1]
                if (paymentsRes.status === 'fulfilled') setPayments(normalizeList(paymentsRes.value))
                if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value)
                // if any rejected with auth -> redirect handled in apiGet; we just surface other errors
                const rej = results.find(r => r.status === 'rejected') as PromiseRejectedResult | undefined
                if (rej && rej.reason && ![401, 403].includes(rej.reason?.status)) {
                    setError(rej.reason?.message ?? 'Failed to load some finance data')
                }
            })
            .catch(err => { if (mounted) setError(err?.message ?? 'Failed to load finance') })
            .finally(() => { if (mounted) setLoading(false) })

        return () => { mounted = false }
    }, [churchId])

    if (loading) return <div>Loading collections…</div>
    if (error) return <div className="text-red-600">{error}</div>

    return (
        <div className="space-y-4">
            <div className="bg-white rounded shadow p-4">
                <div className="text-sm text-gray-500">Finance summary</div>
                <div className="mt-2 flex gap-4">
                    <div className="p-3 border rounded">
                        <div className="text-xs text-gray-500">Total payments (30d)</div>
                        <div className="text-xl font-bold">{summary?.total_payments ?? summary?.total_payments ?? summary?.payments_total ?? 0}</div>
                    </div>
                    <div className="p-3 border rounded">
                        <div className="text-xs text-gray-500">Tithes (30d)</div>
                        <div className="text-xl font-bold">{summary?.total_tithes ?? summary?.tithes_total ?? 0}</div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded shadow p-4">
                <div className="text-lg font-semibold mb-2">Recent payments</div>
                <div className="overflow-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-xs text-gray-500">
                            <tr>
                                <th className="p-2">#</th>
                                <th className="p-2">Type</th>
                                <th className="p-2">Amount</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((p: any) => (
                                <tr key={p.id} className="border-t">
                                    <td className="p-2">{p.id}</td>
                                    <td className="p-2">{p.type ?? p.payment_method ?? '—'}</td>
                                    <td className="p-2">{p.amount ?? '0'}</td>
                                    <td className="p-2">{p.status ?? '—'}</td>
                                    <td className="p-2">{p.created_at ?? p.createdAt ?? ''}</td>
                                </tr>
                            ))}
                            {payments.length === 0 && <tr><td colSpan={5} className="p-4 text-gray-500">No payments found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
