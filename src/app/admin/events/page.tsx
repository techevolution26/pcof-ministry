'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchAdminEvents, deleteAdminEvent } from '@/lib/adminApi'
import { useAdminAuth } from '@/hooks/useAdminAuth'

export default function AdminEventsPage() {
    const { user } = useAdminAuth()
    const [events, setEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true
            ; (async () => {
                setLoading(true)
                try {
                    const body = await fetchAdminEvents()
                    const list = Array.isArray(body) ? body : (body?.data ?? [])
                    if (!mounted) return
                    setEvents(list)
                } catch (err: any) {
                    if (!mounted) return
                    setError(err?.message ?? 'Failed to load events')
                } finally {
                    if (mounted) setLoading(false)
                }
            })()
        return () => { mounted = false }
    }, [])

    async function handleDelete(id: number) {
        if (!confirm('Delete event?')) return
        try {
            await deleteAdminEvent(id)
            setEvents(prev => prev.filter(e => e.id !== id))
        } catch (err: any) {
            alert(err?.message ?? 'Delete failed')
        }
    }

    if (loading) return <div>Loading events…</div>
    if (error) return <div className="text-red-600">{error}</div>

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">Events</h1>
                <Link href="/admin/events/new" className="px-3 py-2 bg-sky-600 text-white rounded">Create event</Link>
            </div>

            <div className="bg-white rounded shadow overflow-auto">
                <table className="w-full text-left text-sm">
                    <thead className="text-xs text-gray-500">
                        <tr>
                            <th className="p-3">Title</th>
                            <th className="p-3">Church</th>
                            <th className="p-3">Starts</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map(e => (
                            <tr key={e.id} className="border-t last:border-b">
                                <td className="p-3">{e.title}</td>
                                <td className="p-3">{e.church?.name ?? e.church_id ?? '—'}</td>
                                <td className="p-3">{e.starts_at ? new Date(e.starts_at).toLocaleString() : '—'}</td>
                                <td className="p-3">
                                    <div className="flex gap-2">
                                        <Link href={`/admin/events/${e.id}`} className="text-sky-600">View</Link>
                                        <Link href={`/admin/events/${e.id}/edit`} className="text-gray-600">Edit</Link>
                                        <button onClick={() => handleDelete(e.id)} className="text-red-600">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {events.length === 0 && <tr><td colSpan={4} className="p-4 text-gray-500">No events yet.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
