'use client'
import React, { useEffect, useState } from 'react'
import EventCalendar from './EventCalendar'
import { fetchAdminEvents } from '@/lib/adminApi'

export default function AdminEventsMini() {
    const [events, setEvents] = useState<unknown[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
            ; (async () => {
                try {
                    // fetch upcoming events - backend supports q/church_id/page — here we fetch page=1
                    const res = await fetchAdminEvents({ page: 1 })
                    // handle paginated or simple list
                    const list = Array.isArray(res) ? res : (res?.data ?? [])
                    if (!mounted) return
                    setEvents(list.map((e: unknown) => ({
                        id: e.id,
                        title: e.title,
                        starts_at: e.starts_at,
                        ends_at: e.ends_at,
                    })))
                } catch (err) { console.error(err) }
                finally { if (mounted) setLoading(false) }
            })()
        return () => { mounted = false }
    }, [])

    if (loading) return <div className="p-4 bg-white rounded shadow">Loading events…</div>
    if (!events.length) return <div className="p-4 bg-white rounded shadow text-sm text-gray-500">No upcoming events</div>

    return (
        <div className="bg-white rounded shadow p-4">
            <EventCalendar events={events} />
        </div>
    )
}
