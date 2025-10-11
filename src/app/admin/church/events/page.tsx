'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import {
    fetchEvents,
    fetchEventRsvps,
    createEventRsvp,
    deleteEventRsvp,
} from '@/lib/adminApi'
import ChurchMemberTypeahead from '@/components/ChurchMemberTypeahead'
import Toast from '@/components/Toast'

export default function EventsPage() {
    const { user, isLoading } = useAdminAuth()
    const churchId = user?.church_id

    const [events, setEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [q, setQ] = useState<string>('')

    // pagination (server supports per_page)
    const [page, setPage] = useState<number>(1)
    const perPage = 50

    // attendee modal
    const [showAttendeeModal, setShowAttendeeModal] = useState(false)
    const [modalEvent, setModalEvent] = useState<any | null>(null)
    const [attendees, setAttendees] = useState<any[]>([])
    const [attendeesLoading, setAttendeesLoading] = useState(false)
    const [attendeeSelected, setAttendeeSelected] = useState<any | null>(null)
    const [attendeeSaving, setAttendeeSaving] = useState(false)

    const [toast, setToast] = useState<any | null>(null)

    useEffect(() => {
        let mounted = true
        async function load() {
            setLoading(true)
            try {
                const params: any = { per_page: perPage, page }
                if (churchId) params.church_id = churchId
                if (q && q.trim().length) params.q = q.trim()
                const res = await fetchEvents(params)
                const list = Array.isArray(res) ? res : (res?.data ?? [])
                if (!mounted) return
                // normalize: ensure each event has attendees_count (optional)
                setEvents(list.map((ev: any) => ({ ...ev, _loadedAttendees: false })))
                setError(null)
            } catch (err: any) {
                console.error('load events failed', err)
                if (!mounted) return
                setError(err?.message ?? 'Failed to load events')
                setEvents([])
            } finally {
                if (mounted) setLoading(false)
            }
        }

        if (!isLoading) load()
        return () => { mounted = false }
    }, [churchId, isLoading, page, q])

    function openAttendeesModal(ev: any) {
        setModalEvent(ev)
        setShowAttendeeModal(true)
        loadAttendees(ev)
    }

    async function loadAttendees(ev: any) {
        setAttendeesLoading(true)
        try {
            const r = await fetchEventRsvps(ev.id)
            const list = Array.isArray(r) ? r : (r?.data ?? [])
            setAttendees(list)
            // update event entry with cached count
            setEvents(prev => prev.map(e => e.id === ev.id ? ({ ...e, attendees_count: list.length, _loadedAttendees: true }) : e))
        } catch (err: any) {
            console.error('load attendees failed', err)
            setToast({ show: true, type: 'error', message: err?.message ?? 'Failed to load attendees' })
        } finally {
            setAttendeesLoading(false)
        }
    }

    async function handleAddAttendee() {
        if (!attendeeSelected) {
            setToast({ show: true, type: 'error', message: 'Pick a member to add' })
            return
        }
        if (!modalEvent?.id) return
        setAttendeeSaving(true)
        try {
            const payload = {
                event_id: modalEvent.id,
                member_id: attendeeSelected.id,
                status: 'attending',
                church_id: modalEvent.church_id ?? churchId ?? null,
            }
            const res = await createEventRsvp(payload)
            const saved = res?.data ?? res
            setAttendees(prev => [saved, ...prev])
            setEvents(prev => prev.map(e => e.id === modalEvent.id ? ({ ...e, attendees_count: (e.attendees_count ?? 0) + 1 }) : e))
            setAttendeeSelected(null)
            setToast({ show: true, type: 'success', message: 'Attendee added' })
        } catch (err: any) {
            console.error('add attendee failed', err)
            setToast({ show: true, type: 'error', message: err?.message ?? 'Failed to add attendee' })
        } finally {
            setAttendeeSaving(false)
        }
    }

    async function handleRemoveAttendee(rsvp: any) {
        if (!rsvp?.id) return
        if (!confirm(`Remove attendee ${rsvp.member?.first_name ?? ''} ${rsvp.member?.last_name ?? ''}?`)) return
        try {
            await deleteEventRsvp(rsvp.id)
            setAttendees(prev => prev.filter(a => a.id !== rsvp.id))
            setEvents(prev => prev.map(e => e.id === modalEvent.id ? ({ ...e, attendees_count: Math.max((e.attendees_count ?? 1) - 1, 0) }) : e))
            setToast({ show: true, type: 'success', message: 'Removed attendee' })
        } catch (err: any) {
            console.error('remove attendee failed', err)
            setToast({ show: true, type: 'error', message: err?.message ?? 'Failed to remove attendee' })
        }
    }

    // lightweight search debounce (simple)
    useEffect(() => {
        // reset page on search change
        setPage(1)
    }, [q])

    if (loading) {
        return (
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-lg font-semibold">Events</h1>
                    <Link href="/admin/church/events/new" className="px-3 py-1 bg-sky-600 text-white rounded">New event</Link>
                </div>
                <div className="bg-white rounded shadow p-4">Loading events…</div>
            </div>
        )
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-lg font-semibold">Events</h1>
                    <div className="text-xs text-gray-500">Events for your church{churchId ? '' : ' (all visible)'} — manage RSVPs & attendees</div>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        placeholder="Search title…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        className="p-2 border rounded text-sm"
                    />
                    <Link href="/admin/church/events/new" className="px-3 py-1 bg-sky-600 text-white rounded">New event</Link>
                </div>
            </div>

            <div className="bg-white rounded shadow divide-y">
                {events.map(e => (
                    <div key={e.id} className="p-4 flex items-start gap-4">
                        <div className="w-20 h-16 flex-shrink-0">
                            {e.image_url || e.image_path ? (
                                <img src={e.image_url ?? e.image_path} alt={e.title} className="w-full h-full object-cover rounded" />
                            ) : (
                                <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">No image</div>
                            )}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="font-medium text-sm">{e.title}</div>
                                    <div className="text-xs text-gray-500">
                                        {e.scope ?? (e.church_id ? 'church' : (e.is_national ? 'national' : '—'))} • {e.starts_at ? new Date(e.starts_at).toLocaleString() : '—'}
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-sm font-semibold">{e.capacity ? `Cap: ${e.capacity}` : ''}</div>
                                    <div className="text-xs text-gray-500">{typeof e.attendees_count === 'number' ? `${e.attendees_count} attending` : (e._loadedAttendees ? '0 attending' : '—')}</div>
                                </div>
                            </div>

                            <div className="mt-3 flex items-center gap-2">
                                <Link href={`/admin/church/events/${e.id}`} className="text-sky-600 text-sm">View</Link>
                                <Link href={`/admin/church/events/${e.id}/edit`} className="text-gray-700 text-sm">Edit</Link>
                                <button onClick={() => openAttendeesModal(e)} className="text-sm px-2 py-1 border rounded">Manage RSVPs</button>
                                <Link href={`/admin/finance/payments/new?event_id=${e.id}`} className="text-sm px-2 py-1 border rounded">Record payment</Link>
                            </div>
                        </div>
                    </div>
                ))}

                {events.length === 0 && (
                    <div className="p-4 text-gray-500">No events found.</div>
                )}
            </div>

            {/* simple pagination controls */}
            <div className="mt-3 flex items-center justify-between">
                <div className="text-sm text-gray-500">Showing {events.length} events</div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                    >
                        Prev
                    </button>
                    <div className="px-3 py-1 border rounded text-sm">Page {page}</div>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        className="px-3 py-1 border rounded text-sm"
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Attendees modal */}
            {showAttendeeModal && modalEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full overflow-auto">
                        <div className="flex items-start justify-between p-4 border-b">
                            <div>
                                <h3 className="text-lg font-semibold">RSVPs — {modalEvent.title}</h3>
                                <div className="text-xs text-gray-500">{modalEvent.starts_at ? new Date(modalEvent.starts_at).toLocaleString() : '—'}</div>
                            </div>
                            <div>
                                <button onClick={() => { setShowAttendeeModal(false); setModalEvent(null); setAttendees([]) }} className="px-2 py-1 border rounded">Close</button>
                            </div>
                        </div>

                        <div className="p-4 space-y-3">
                            <div>
                                <label className="block text-xs text-gray-600">Add attendee (member)</label>
                                <div className="flex gap-2 mt-2">
                                    <div className="flex-1">
                                        <ChurchMemberTypeahead
                                            value={attendeeSelected?.id ?? null}
                                            onSelect={m => setAttendeeSelected(m)}
                                            placeholder="Search member…"
                                        />
                                    </div>
                                    <div>
                                        <button onClick={handleAddAttendee} disabled={attendeeSaving} className="px-3 py-1 bg-sky-600 text-white rounded text-sm">
                                            {attendeeSaving ? 'Adding…' : 'Add'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold mb-2">Attendees ({attendees.length})</h4>
                                {attendeesLoading ? (
                                    <div className="text-sm text-gray-500">Loading…</div>
                                ) : attendees.length === 0 ? (
                                    <div className="text-sm text-gray-500">No attendees yet</div>
                                ) : (
                                    <div className="space-y-2">
                                        {attendees.map(a => (
                                            <div key={a.id} className="flex items-center justify-between border rounded px-3 py-2">
                                                <div>
                                                    <div className="font-medium">{a.member ? `${a.member.first_name} ${a.member.last_name}` : `Member #${a.member_id}`}</div>
                                                    <div className="text-xs text-gray-500">{a.status} • {a.notes ?? ''}</div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Link href={`/admin/church/members/${a.member_id}`} className="text-sky-600 text-sm">View</Link>
                                                    <button onClick={() => handleRemoveAttendee(a)} className="text-red-600 text-sm">Remove</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    )
}
