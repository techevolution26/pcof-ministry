// app/admin/church/events/[id]/page.tsx
'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { fetchEventById } from '@/lib/adminApi'
import ChurchMemberTypeahead from '@/components/ChurchMemberTypeahead'
import { fetchEventRsvps, createEventRsvp, deleteEventRsvp } from '@/lib/adminApi'
import Toast from '@/components/Toast'

function fmtDate(dt?: string | null) {
    if (!dt) return '—'
    try { return new Date(dt).toLocaleString() } catch { return dt }
}

export default function EventDetailsPage() {
    const params = useParams()
    const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id
    const id = rawId ?? null
    const router = useRouter()
    const { user, isLoading } = useAdminAuth()

    const [event, setEvent] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)
    const [rsvps, setRsvps] = useState<any[]>([])
    const [attendingMember, setAttendingMember] = useState<any | null>(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [toast, setToast] = useState<any>(null)

    useEffect(() => {
        let mounted = true
        async function load() {
            setLoading(true)
            try {
                if (!id) return
                const evBody = await fetchEventById(id)
                if (!mounted) return
                const ev = evBody?.data ?? evBody
                setEvent(ev)

                const r = await fetchEventRsvps(id)
                if (!mounted) return
                setRsvps(Array.isArray(r) ? r : (r?.data ?? []))
            } catch (err: any) {
                console.error(err)
                if (!mounted) return
                setError(err?.message ?? 'Failed to load event')
            } finally {
                if (mounted) setLoading(false)
            }
        }
        if (!isLoading) load()
        return () => { mounted = false }
    }, [id, isLoading])

    if (isLoading || loading) return <div className="p-6 text-gray-500">Loading…</div>
    if (error) return <div className="p-6 text-red-600">{error}</div>
    if (!event) return <div className="p-6 text-gray-500">Event not found.</div>

    async function handleAddAttendee() {
        if (!attendingMember) {
            setToast({ show: true, message: 'Please pick a member', type: 'error' })
            return
        }
        setSaving(true)
        try {
            const payload = {
                event_id: id,
                member_id: attendingMember.id,
                status: 'attending',
                church_id: event.church_id ?? user?.church_id ?? null,
            }
            const res = await createEventRsvp(payload)
            const saved = res?.data ?? res
            setRsvps(prev => [saved, ...prev])
            setAttendingMember(null)
            setToast({ show: true, message: 'Added attendee', type: 'success' })
        } catch (err: any) {
            console.error(err)
            setToast({ show: true, message: err?.message ?? 'Failed to add', type: 'error' })
        } finally {
            setSaving(false)
        }
    }

    async function handleRemoveAttendee(rsvp: any) {
        if (!window.confirm(`Remove attendee ${rsvp.member?.first_name ?? ''} ${rsvp.member?.last_name ?? ''}?`)) return
        try {
            await deleteEventRsvp(rsvp.id)
            setRsvps(prev => prev.filter(x => x.id !== rsvp.id))
            setToast({ show: true, message: 'Removed', type: 'success' })
        } catch (err: any) {
            console.error(err)
            setToast({ show: true, message: err?.message ?? 'Failed to remove', type: 'error' })
        }
    }

    const imageUrl = event.image_url ?? event.image_path ?? null
    const placeholder = '/images/event-placeholder.png' // add this asset to public/images

    return (
        <div>
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-semibold">{event.title}</h1>
                    <div className="text-sm text-gray-500">{event.location ?? (event.online ? 'Online' : '—')}</div>
                    <div className="text-xs text-gray-400">{event.scope ?? (event.church_id ? 'church' : 'national')} • {fmtDate(event.starts_at)}</div>
                </div>

                <div className="flex gap-2">
                    <Link href={`/admin/church/events/${id}/edit`} className="px-3 py-1 border rounded">Edit</Link>
                    <Link href="/admin/church/events" className="px-3 py-1 border rounded">Back</Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="col-span-2 bg-white rounded shadow p-4">
                    <div className="prose max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: event.description ?? '' }} />


                        {/* Correct tag: <img> not <image>. Use lazy loading and fallback */}
                        <img
                            src={imageUrl ?? placeholder}
                            alt={event.title ?? 'Event image'}
                            loading="lazy"
                            className="max-w-full h-auto rounded shadow-sm object-cover"
                            onError={(e: any) => { e.currentTarget.src = placeholder }}
                        />

                    </div>
                </div>

                <aside className="bg-white rounded shadow p-4">
                    <h3 className="text-sm font-semibold mb-2">Add attendee</h3>
                    <ChurchMemberTypeahead churchId={event.church_id ?? user?.church_id} onSelect={(m) => setAttendingMember(m)} value={attendingMember} />
                    <div className="mt-2 flex gap-2">
                        <button onClick={handleAddAttendee} disabled={saving} className="px-3 py-1 bg-sky-600 text-white rounded">Add</button>
                        <button onClick={() => setAttendingMember(null)} className="px-3 py-1 border rounded">Clear</button>
                    </div>
                </aside>
            </div>

            <section className="bg-white rounded shadow p-4">
                <h2 className="text-lg font-semibold mb-3">Attendees ({rsvps.length})</h2>
                <div className="space-y-2">
                    {rsvps.map(r => (
                        <div key={r.id} className="flex items-center justify-between border-b py-2">
                            <div>
                                <div className="font-medium">{r.member ? `${r.member.first_name} ${r.member.last_name}` : `Member #${r.member_id}`}</div>
                                <div className="text-xs text-gray-500">{r.status} • {r.notes ?? ''}</div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => router.push(`/admin/church/members/${r.member_id}`)} className="text-sky-600 text-sm">View</button>
                                <button onClick={() => handleRemoveAttendee(r)} className="text-red-600 text-sm">Remove</button>
                            </div>
                        </div>
                    ))}
                    {rsvps.length === 0 && <div className="text-gray-500">No attendees yet</div>}
                </div>
            </section>

            {toast && <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    )
}
