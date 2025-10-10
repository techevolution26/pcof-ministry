'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Toast from '@/components/Toast'
import { fetchAdminEventById, deleteAdminEvent } from '@/lib/adminApi'

export default function EventShow() {
    const { id } = useParams() as { id?: string }
    const router = useRouter()
    const [event, setEvent] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState(false)
    const [toast, setToast] = useState<any | null>(null)

    useEffect(() => {
        if (!id) return
        let mounted = true
            ; (async () => {
                setLoading(true)
                try {
                    const body = await fetchAdminEventById(id)
                    if (!mounted) return
                    setEvent(body?.data ?? body)
                } catch (err: any) {
                    console.error('fetch event failed', err)
                    router.replace('/admin/events')
                } finally {
                    if (mounted) setLoading(false)
                }
            })()
        return () => { mounted = false }
    }, [id, router])

    async function handleDelete() {
        if (!event?.id) return
        if (!confirm('Delete event?')) return
        setDeleting(true)
        try {
            await deleteAdminEvent(event.id)
            setToast({ show: true, message: 'Event deleted', type: 'success' })
            setTimeout(() => router.push('/admin/events'), 700)
        } catch (err: any) {
            console.error('delete failed', err)
            setToast({ show: true, message: err?.message ?? 'Delete failed', type: 'error' })
        } finally {
            setDeleting(false)
        }
    }

    if (loading) return <div>Loading event…</div>
    if (!event) return null

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">{event.title}</h1>
                    <div className="text-sm text-gray-500">{event.church?.name ?? (event.is_national ? 'National' : '—')}</div>
                    <div className="text-xs text-gray-400">{event.starts_at ? new Date(event.starts_at).toLocaleString() : ''}</div>
                </div>

                <div className="flex items-center gap-2">
                    <Link href="/admin/events" className="px-3 py-1 border rounded">Back</Link>
                    <Link href={`/admin/events/${event.id}/edit`} className="px-3 py-1 border rounded">Edit</Link>
                    <button onClick={handleDelete} disabled={deleting} className="px-3 py-1 bg-red-50 text-red-600 border rounded">
                        {deleting ? 'Deleting…' : 'Delete'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-2 bg-white rounded shadow p-4 prose max-w-none">
                    {event.image_url || event.image_path ? (
                        // use image_url accessor if available
                        <img src={event.image_url ?? event.image_path} alt={event.title} className="w-full max-h-80 object-cover rounded mb-4" />
                    ) : null}
                    <div dangerouslySetInnerHTML={{ __html: event.description ?? '' }} />
                    <div className="mt-4 text-sm text-gray-500">
                        <div><strong>Location:</strong> {event.location ?? (event.online ? 'Online' : '—')}</div>
                        <div><strong>Capacity:</strong> {event.capacity ?? '—'}</div>
                        <div><strong>Scope:</strong> {event.is_national ? 'National' : (event.church_id ? 'Church' : '—')}</div>
                    </div>
                </div>

                <aside className="bg-white rounded shadow p-4">
                    <h3 className="text-sm font-semibold mb-3">Actions</h3>
                    <div className="flex flex-col gap-2">
                        <Link href={`/admin/events/${event.id}/rsvps`} className="px-3 py-2 border rounded text-sm text-sky-600">Manage RSVPs</Link>
                        <Link href={`/admin/events/${event.id}/attendees`} className="px-3 py-2 border rounded text-sm">Attendees</Link>
                        <Link href={`/admin/finance/payments/new?event_id=${event.id}`} className="px-3 py-2 border rounded text-sm">Record payment for event</Link>
                    </div>
                </aside>
            </div>

            {toast && <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    )
}
