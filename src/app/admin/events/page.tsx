'use client'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { fetchAdminEvents, deleteAdminEvent, fetchChurchesList } from '@/lib/adminApi'
import Toast from '@/components/Toast'
import AdminEventCard from '@/components/AdminEventCard'

export default function AdminEventsPage() {
    const { user } = useAdminAuth()
    const [events, setEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [toast, setToast] = useState<any | null>(null)

    // controls
    const [q, setQ] = useState('')
    const qRef = useRef('')
    const [scope, setScope] = useState<'all' | 'national' | 'church'>('all')
    const [churchId, setChurchId] = useState<string | number | ''>('')
    const [page, setPage] = useState<number>(1)
    const [perPage] = useState<number>(30)

    const [churches, setChurches] = useState<any[]>([])
    const [rowDeleting, setRowDeleting] = useState<Record<string, boolean>>({})

    // debounce search
    useEffect(() => { qRef.current = q }, [q])
    useEffect(() => {
        const t = setTimeout(() => load({ page: 1 }), 350)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q, scope, churchId])

    const buildQuery = useCallback(() => {
        const params = new URLSearchParams()
        if (qRef.current) params.set('q', qRef.current)
        if (scope === 'national') params.set('scope', 'national')
        if (scope === 'church' && churchId) params.set('church_id', String(churchId))
        params.set('page', String(page || 1))
        params.set('per_page', String(perPage))
        return params.toString() ? `?${params.toString()}` : ''
    }, [scope, churchId, page, perPage])

    const load = useCallback(async ({ page: p = 1 } = {}) => {
        setLoading(true)
        setError(null)
        try {
            const qstr = buildQuery()
            const body = await fetchAdminEvents(qstr)
            const list = Array.isArray(body) ? body : (body?.data ?? [])
            setEvents(list)
        } catch (err: any) {
            console.error('load events failed', err)
            setError(err?.message ?? 'Failed to load events')
        } finally {
            setLoading(false)
        }
    }, [buildQuery])

    useEffect(() => {
        let mounted = true
            ; (async () => {
                try {
                    const c = await fetchChurchesList()
                    if (!mounted) return
                    setChurches(Array.isArray(c) ? c : (c?.data ?? []))
                } catch (e) {
                    console.warn('failed to load churches', e)
                }
                await load({ page: 1 })
            })()
        return () => { mounted = false }
    }, [load])

    async function handleDelete(id: number) {
        if (!confirm('Delete event? This cannot be undone.')) return
        // optimistic remove
        setRowDeleting(prev => ({ ...prev, [String(id)]: true }))
        const snapshot = events
        setEvents(prev => prev.filter(e => String(e.id) !== String(id)))
        try {
            await deleteAdminEvent(id)
            setToast({ show: true, message: 'Event deleted', type: 'success' })
        } catch (err: any) {
            console.error('delete failed', err)
            setEvents(snapshot) // rollback
            setToast({ show: true, message: err?.message ?? 'Delete failed', type: 'error' })
        } finally {
            setRowDeleting(prev => {
                const copy = { ...prev }
                delete copy[String(id)]
                return copy
            })
        }
    }

    if (loading) {
        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Events</h1>
                    <Link href="/admin/events/new" className="px-3 py-2 bg-sky-600 text-white rounded">Create event</Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-28 bg-gray-100 rounded animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    if (error) {
        return <div className="p-4 text-red-600">Error loading events: {error}</div>
    }

    return (
        <div>
            <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Events</h1>
                    <div className="text-sm text-gray-500">Manage national and church-level events</div>
                </div>

                <div className="flex gap-2 items-center">
                    <Link href="/admin/events/new" className="px-3 py-2 bg-sky-600 text-white rounded text-sm">Create event</Link>
                </div>
            </div>

            <div className="mb-4 flex flex-col md:flex-row gap-3">
                <input
                    value={q}
                    onChange={(e) => { setQ(e.target.value); setPage(1) }}
                    placeholder="Search title…"
                    className="p-2 border rounded w-full md:w-1/3"
                />

                <select value={scope} onChange={(e) => { setScope(e.target.value as any); setPage(1) }} className="p-2 border rounded">
                    <option value="all">All events</option>
                    <option value="national">National events</option>
                    <option value="church">By church</option>
                </select>

                {scope === 'church' && (
                    <select value={String(churchId)} onChange={(e) => { setChurchId(e.target.value); setPage(1) }} className="p-2 border rounded">
                        <option value="">— select church —</option>
                        {churches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {events.map(e => (
                    <div key={e.id} className="relative">
                        <AdminEventCard events={[e]} />
                        <div className="mt-2 flex gap-2 justify-end">
                            <Link href={`/admin/events/${e.id}/edit`} className="text-sm px-2 py-1 border rounded">Edit</Link>
                            <Link href={`/admin/events/${e.id}`} className="text-sm px-2 py-1 border rounded">View</Link>
                            <button
                                onClick={() => handleDelete(e.id)}
                                disabled={!!rowDeleting[String(e.id)]}
                                className="text-sm px-2 py-1 rounded border text-red-600 disabled:opacity-50"
                            >
                                {rowDeleting[String(e.id)] ? 'Deleting…' : 'Delete'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {events.length === 0 && <div className="text-sm text-gray-500">No events found.</div>}

            <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-500">Showing {events.length} events</div>
                <div className="flex gap-2 items-center">
                    <button onClick={() => { if (page > 1) { setPage(p => p - 1); load({ page: Math.max(1, page - 1) }) } }} className="px-3 py-1 border rounded disabled:opacity-50" disabled={page <= 1}>Prev</button>
                    <div className="text-sm">Page {page}</div>
                    <button onClick={() => { setPage(p => p + 1); load({ page: page + 1 }) }} className="px-3 py-1 border rounded">Next</button>
                </div>
            </div>

            {toast && <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    )
}
