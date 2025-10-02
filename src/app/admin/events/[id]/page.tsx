'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { fetchAdminEventById } from '@/lib/adminApi'
import EventCards from '@/components/AdminEventCard'

export default function EventShow() {
    const { id } = useParams() as { id?: string }
    const router = useRouter()
    const [event, setEvent] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!id) return
        let mounted = true
            ; (async () => {
                try {
                    const data = await fetchAdminEventById(id)
                    if (!mounted) return
                    setEvent(data?.data ?? data)
                } catch (err) {
                    // redirect if not found or unauthorized
                    console.error(err)
                    router.replace('/admin/events')
                } finally {
                    if (mounted) setLoading(false)
                }
            })()
        return () => { mounted = false }
    }, [id, router])

    if (loading) return <div>Loading event…</div>
    if (!event) return null

    return (
        // <div>
        //     <div className="flex items-center justify-between mb-4">
        //         <div>
        //             <h1 className="text-2xl font-bold">{event.title}</h1>
        //             <div className="text-sm text-gray-500">{event.church?.name ?? ''}</div>
        //         </div>
        //         <div className="flex gap-2">
        //             <Link href={`/admin/events/${id}/edit`} className="px-3 py-2 border rounded">Edit</Link>
        //             <Link href="/admin/events" className="px-3 py-2 border rounded">Back</Link>
        //         </div>
        //     </div>

        //     <div className="bg-white p-4 rounded shadow">
        //         <p className="mb-2"><strong>Starts:</strong> {event.starts_at ? new Date(event.starts_at).toLocaleString() : '—'}</p>
        //         <p className="mb-2"><strong>Ends:</strong> {event.ends_at ? new Date(event.ends_at).toLocaleString() : '—'}</p>
        //         <p className="mb-2"><strong>Location:</strong> {event.location ?? '—'}</p>
        //         <div className="mt-4">
        //             <h3 className="font-semibold mb-2">Description</h3>
        //             <div className="prose" dangerouslySetInnerHTML={{ __html: event.description ?? '' }} />
        //         </div>
        //     </div>
        // </div>

<EventCards events={[event]} />  )
}
