'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { fetchEvents } from '@/lib/adminApi'

export default function EventsPage() {
    const { user, isLoading } = useAdminAuth()
    const churchId = user?.church_id
    const [events, setEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        async function load() {
            setLoading(true)
            try {
                const res = await fetchEvents({ church_id: churchId, per_page: 50 })
                const list = Array.isArray(res) ? res : (res?.data ?? [])
                if (!mounted) return
                setEvents(list)
            } catch (err) {
                console.error(err)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        if (!isLoading) load()
        return () => { mounted = false }
    }, [churchId, isLoading])

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-lg font-semibold">Events</h1>
                <Link href="/admin/church/events/new" className="px-3 py-1 bg-sky-600 text-white rounded">New event</Link>
            </div>
            <div className="bg-white rounded shadow p-4">
                {loading ? <div>Loading…</div> : events.map(e => (
                    <div key={e.id} className="border-b py-3 flex justify-between">
                        <div>
                            <div className="font-medium">{e.title}</div>
                            <div className="text-xs text-gray-500">{e.scope ?? (e.church_id ? 'church' : 'national')} • {e.starts_at ? new Date(e.starts_at).toLocaleString() : '—'}</div>
                        </div>
                        <div className="flex gap-2 items-center">
                            <Link href={`/admin/church/events/${e.id}`} className="text-sky-600 text-sm">View</Link>
                            <Link href={`/admin/church/events/${e.id}/edit`} className="text-gray-700 text-sm">Edit</Link>
                        </div>
                    </div>
                ))}
                {!loading && events.length === 0 && <div className="text-gray-500">No events</div>}
            </div>
        </div>
    )
}
