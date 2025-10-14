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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faCalendar,
    faCalendarPlus,
    faSearch,
    faEye,
    faEdit,
    faUsers,
    faReceipt,
    faSpinner,
    faArrowLeft,
    faPlus,
    faTimes,
    faUserPlus,
    faUserMinus,
    faMapMarkerAlt,
    faClock
} from '@fortawesome/free-solid-svg-icons'

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
            setToast({ show: true, type: 'success', message: 'Attendee added successfully' })
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
            setToast({ show: true, type: 'success', message: 'Attendee removed successfully' })
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

    if (isLoading || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center py-12">
                        <FontAwesomeIcon
                            icon={faSpinner}
                            className="mx-auto mb-4 text-2xl text-blue-600 animate-spin"
                        />
                        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                            Loading events...
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/admin/church"
                                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors group"
                                >
                                    <FontAwesomeIcon
                                        icon={faArrowLeft}
                                        className="text-sm group-hover:-translate-x-1 transition-transform"
                                    />
                                    <span className="text-sm font-medium">Back to Dashboard</span>
                                </Link>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                                Church Events
                            </h1>
                            <p className="text-lg text-gray-600 dark:text-gray-300 font-light">
                                Manage events, RSVPs, and attendees for your church
                            </p>
                        </div>
                        <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-3 shadow-sm">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                                <FontAwesomeIcon icon={faCalendar} className="text-white text-lg" />
                            </div>
                            <div className="hidden sm:block">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">Total Events</div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{events.length}</div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Actions Bar */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Showing {events.length} events
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative">
                            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                            <input
                                placeholder="Search events by title..."
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white/80 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-full sm:w-64"
                            />
                        </div>
                        <Link
                            href="/admin/church/events/new"
                            className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                        >
                            <FontAwesomeIcon icon={faCalendarPlus} />
                            New Event
                        </Link>
                    </div>
                </div>

                {/* Events List */}
                <section>
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 overflow-hidden">
                        {events.length === 0 ? (
                            <div className="text-center py-12 px-6">
                                <FontAwesomeIcon
                                    icon={faCalendar}
                                    className="mx-auto text-4xl text-gray-400 dark:text-gray-500 mb-4"
                                />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    {q ? 'No events found' : 'No events yet'}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                                    {q ? 'Try adjusting your search criteria' : 'Get started by creating your first church event.'}
                                </p>
                                <Link
                                    href="/admin/church/events/new"
                                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center gap-2"
                                >
                                    <FontAwesomeIcon icon={faCalendarPlus} />
                                    Create First Event
                                </Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {events.map(e => (
                                    <div key={e.id} className="p-6 hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                                        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                                            {/* Event Image */}
                                            <div className="flex-shrink-0">
                                                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                                    {e.image_url || e.image_path ? (
                                                        <img
                                                            src={e.image_url ?? e.image_path}
                                                            alt={e.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <FontAwesomeIcon icon={faCalendar} className="text-white text-xl" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Event Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                            {e.title}
                                                        </h3>
                                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <FontAwesomeIcon icon={faClock} className="text-blue-500" />
                                                                <span>{e.starts_at ? new Date(e.starts_at).toLocaleString() : '—'}</span>
                                                            </div>
                                                            {e.location && (
                                                                <div className="flex items-center gap-2">
                                                                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-green-500" />
                                                                    <span>{e.location}</span>
                                                                </div>
                                                            )}
                                                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${e.scope === 'national' || e.is_national
                                                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                                }`}>
                                                                {e.scope ?? (e.church_id ? 'Church' : (e.is_national ? 'National' : '—'))}
                                                            </div>
                                                        </div>
                                                        {e.description && (
                                                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                                                {e.description.replace(/<[^>]*>/g, '')}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-col items-end gap-2">
                                                        <div className="text-right">
                                                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                                                {e.capacity ? `${e.capacity} capacity` : 'Unlimited capacity'}
                                                            </div>
                                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                                {typeof e.attendees_count === 'number'
                                                                    ? `${e.attendees_count} attending`
                                                                    : (e._loadedAttendees ? '0 attending' : '—')
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex flex-wrap items-center gap-3 mt-4">
                                                    <Link
                                                        href={`/admin/church/events/${e.id}`}
                                                        className="px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200 flex items-center gap-2 group"
                                                    >
                                                        <FontAwesomeIcon icon={faEye} className="group-hover:scale-110 transition-transform" />
                                                        View Details
                                                    </Link>
                                                    <Link
                                                        href={`/admin/church/events/${e.id}/edit`}
                                                        className="px-4 py-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-200 flex items-center gap-2 group"
                                                    >
                                                        <FontAwesomeIcon icon={faEdit} className="group-hover:scale-110 transition-transform" />
                                                        Edit
                                                    </Link>
                                                    <button
                                                        onClick={() => openAttendeesModal(e)}
                                                        className="px-4 py-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-all duration-200 flex items-center gap-2 group"
                                                    >
                                                        <FontAwesomeIcon icon={faUsers} className="group-hover:scale-110 transition-transform" />
                                                        Manage RSVPs
                                                    </button>
                                                    <Link
                                                        href={`/admin/church/finance/payments/new?event_id=${e.id}`}
                                                        className="px-4 py-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all duration-200 flex items-center gap-2 group"
                                                    >
                                                        <FontAwesomeIcon icon={faReceipt} className="group-hover:scale-110 transition-transform" />
                                                        Record Payment
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Pagination */}
                {events.length > 0 && (
                    <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Page {page} • {events.length} events shown
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="px-4 py-2 bg-white/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                            >
                                Previous
                            </button>

                            <div className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium">
                                {page}
                            </div>

                            <button
                                onClick={() => setPage(p => p + 1)}
                                className="px-4 py-2 bg-white/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 flex items-center gap-2"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
                        <div className="flex items-center gap-3 text-red-800 dark:text-red-200">
                            <FontAwesomeIcon icon={faTimes} />
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {/* Attendees Modal */}
                {showAttendeeModal && modalEvent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 dark:border-gray-700/50 max-w-2xl w-full max-h-[90vh] overflow-hidden">
                            {/* Modal Header */}
                            <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                                        <FontAwesomeIcon icon={faUsers} className="text-green-500" />
                                        Manage RSVPs
                                    </h3>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {modalEvent.title} • {modalEvent.starts_at ? new Date(modalEvent.starts_at).toLocaleString() : '—'}
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setShowAttendeeModal(false); setModalEvent(null); setAttendees([]) }}
                                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200"
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">
                                {/* Add Attendee Section */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <FontAwesomeIcon icon={faUserPlus} className="text-blue-500" />
                                        Add Attendee
                                    </h4>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="flex-1">
                                            <ChurchMemberTypeahead
                                                value={attendeeSelected?.id ?? null}
                                                onSelect={m => setAttendeeSelected(m)}
                                                placeholder="Search for a church member..."
                                            />
                                        </div>
                                        <button
                                            onClick={handleAddAttendee}
                                            disabled={attendeeSaving || !attendeeSelected}
                                            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                                        >
                                            {attendeeSaving ? (
                                                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                            ) : (
                                                <FontAwesomeIcon icon={faUserPlus} />
                                            )}
                                            Add
                                        </button>
                                    </div>
                                </div>

                                {/* Attendees List */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <FontAwesomeIcon icon={faUsers} className="text-purple-500" />
                                        Current Attendees ({attendees.length})
                                    </h4>

                                    {attendeesLoading ? (
                                        <div className="text-center py-8">
                                            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-blue-600 mb-2" />
                                            <div className="text-sm text-gray-600 dark:text-gray-400">Loading attendees...</div>
                                        </div>
                                    ) : attendees.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                            <FontAwesomeIcon icon={faUsers} className="text-2xl mb-2 opacity-50" />
                                            <p>No attendees yet. Add members using the form above.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {attendees.map(a => (
                                                <div key={a.id} className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-700/50 rounded-2xl border border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 transition-colors duration-200">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm">
                                                            {a.member ? `${a.member.first_name?.charAt(0)}${a.member.last_name?.charAt(0)}` : 'M'}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900 dark:text-white">
                                                                {a.member ? `${a.member.first_name} ${a.member.last_name}` : `Member #${a.member_id}`}
                                                            </div>
                                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                                <span className="capitalize">{a.status}</span>
                                                                {a.notes && ` • ${a.notes}`}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            href={`/admin/church/members/${a.member_id}`}
                                                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200 group"
                                                            title="View member"
                                                        >
                                                            <FontAwesomeIcon icon={faEye} className="group-hover:scale-110 transition-transform" />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleRemoveAttendee(a)}
                                                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 group"
                                                            title="Remove attendee"
                                                        >
                                                            <FontAwesomeIcon icon={faUserMinus} className="group-hover:scale-110 transition-transform" />
                                                        </button>
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
        </div>
    )
}