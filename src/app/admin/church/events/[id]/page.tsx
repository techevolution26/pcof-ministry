'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { fetchEventById } from '@/lib/adminApi'
import ChurchMemberTypeahead from '@/components/ChurchMemberTypeahead'
import { fetchEventRsvps, createEventRsvp, deleteEventRsvp } from '@/lib/adminApi'
import Toast from '@/components/Toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faArrowLeft,
    faCalendar,
    faMapMarkerAlt,
    faClock,
    faUsers,
    faUserPlus,
    faUserMinus,
    faEye,
    faEdit,
    faSpinner,
    faTimes,
    faGlobe
} from '@fortawesome/free-solid-svg-icons'

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

    const [event, setEvent] = useState<unknown | null>(null)
    const [loading, setLoading] = useState(true)
    const [rsvps, setRsvps] = useState<unknown[]>([])
    const [attendingMember, setAttendingMember] = useState<unknown | null>(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [toast, setToast] = useState<unknown>(null)

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
            } catch (err: unknown) {
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
                            Loading event details...
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <FontAwesomeIcon icon={faTimes} className="text-4xl text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Event</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                    <Link
                        href="/admin/church/events"
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center gap-2"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        Back to Events
                    </Link>
                </div>
            </div>
        )
    }

    if (!event) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <FontAwesomeIcon icon={faCalendar} className="text-4xl text-gray-400 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Event Not Found</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">The event you&apos;re looking for doesn&apos;t exist.</p>
                    <Link
                        href="/admin/church/events"
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center gap-2"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        Back to Events
                    </Link>
                </div>
            </div>
        )
    }

    async function handleAddAttendee() {
        if (!attendingMember) {
            setToast({ show: true, message: 'Please select a member to add', type: 'error' })
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
            setToast({ show: true, message: 'Attendee added successfully', type: 'success' })
        } catch (err: unknown) {
            console.error(err)
            setToast({ show: true, message: err?.message ?? 'Failed to add attendee', type: 'error' })
        } finally {
            setSaving(false)
        }
    }

    async function handleRemoveAttendee(rsvp: unknown) {
        if (!window.confirm(`Remove attendee ${rsvp.member?.first_name ?? ''} ${rsvp.member?.last_name ?? ''}?`)) return
        try {
            await deleteEventRsvp(rsvp.id)
            setRsvps(prev => prev.filter(x => x.id !== rsvp.id))
            setToast({ show: true, message: 'Attendee removed successfully', type: 'success' })
        } catch (err: unknown) {
            console.error(err)
            setToast({ show: true, message: err?.message ?? 'Failed to remove attendee', type: 'error' })
        }
    }

    const imageUrl = event.image_url ?? event.image_path ?? null
    const placeholder = '/images/event-placeholder.png'

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/admin/church/events"
                                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors group"
                                >
                                    <FontAwesomeIcon
                                        icon={faArrowLeft}
                                        className="text-sm group-hover:-translate-x-1 transition-transform"
                                    />
                                    <span className="text-sm font-medium">Back to Events</span>
                                </Link>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                                Event Details
                            </h1>
                        </div>
                        <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-3 shadow-sm">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                                <FontAwesomeIcon icon={faCalendar} className="text-white text-lg" />
                            </div>
                            <div className="hidden sm:block">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">Event Details</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {event.scope ?? (event.church_id ? 'Church' : 'National')}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Event Information Card */}
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 overflow-hidden">
                            {/* Event Image */}
                            {imageUrl && (
                                <div className="w-full h-64 bg-gradient-to-br from-blue-500 to-purple-600">
                                    <img
                                        src={imageUrl}
                                        alt={event.title ?? 'Event image'}
                                        loading="lazy"
                                        className="w-full h-full object-cover"
                                        onError={(e: unknown) => { e.currentTarget.src = placeholder }}
                                    />
                                </div>
                            )}

                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{event.title}</h2>
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                            <div className="flex items-center gap-2">
                                                <FontAwesomeIcon icon={faClock} className="text-blue-500" />
                                                <span>{fmtDate(event.starts_at)}</span>
                                            </div>
                                            {event.location && (
                                                <div className="flex items-center gap-2">
                                                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-green-500" />
                                                    <span>{event.location}</span>
                                                </div>
                                            )}
                                            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${event.scope === 'national' || event.is_national
                                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                }`}>
                                                <FontAwesomeIcon icon={event.online ? faGlobe : faMapMarkerAlt} className="text-xs" />
                                                {event.scope ?? (event.church_id ? 'Church Event' : 'National Event')}
                                                {event.online && ' • Online'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Event Description */}
                                {event.description && (
                                    <div className="prose dark:prose-invert max-w-none">
                                        <div dangerouslySetInnerHTML={{ __html: event.description }} />
                                    </div>
                                )}

                                {/* Event Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{rsvps.length}</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Attendees</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {event.capacity || '∞'}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Capacity</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {event.online ? 'Online' : 'In-person'}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Format</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {event.scope ?? 'Church'}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Scope</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Attendees List Card */}
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                <FontAwesomeIcon icon={faUsers} className="text-purple-500 text-lg" />
                                Event Attendees ({rsvps.length})
                            </h2>

                            {rsvps.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <FontAwesomeIcon icon={faUsers} className="text-2xl mb-2 opacity-50" />
                                    <p>No attendees yet. Add members using the form in the sidebar.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {rsvps.map(r => (
                                        <div key={r.id} className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-700/50 rounded-2xl border border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 transition-colors duration-200">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg">
                                                    {r.member ? `${r.member.first_name?.charAt(0)}${r.member.last_name?.charAt(0)}` : 'M'}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900 dark:text-white">
                                                        {r.member ? `${r.member.first_name} ${r.member.last_name}` : `Member #${r.member_id}`}
                                                    </div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                                        <span className="capitalize">{r.status}</span>
                                                        {r.notes && ` • ${r.notes}`}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => router.push(`/admin/church/members/${r.member_id}`)}
                                                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200 group"
                                                    title="View member"
                                                >
                                                    <FontAwesomeIcon icon={faEye} className="group-hover:scale-110 transition-transform" />
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveAttendee(r)}
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

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Actions Card */}
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <Link
                                    href={`/admin/church/events/${id}/edit`}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                    <FontAwesomeIcon icon={faEdit} />
                                    Edit Event
                                </Link>

                                <Link
                                    href="/admin/church/events"
                                    className="w-full py-3 px-4 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-400 text-gray-700 dark:text-gray-300 font-semibold rounded-2xl hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                    <FontAwesomeIcon icon={faArrowLeft} />
                                    Back to Events
                                </Link>
                            </div>
                        </div>

                        {/* Add Attendee Card */}
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <FontAwesomeIcon icon={faUserPlus} className="text-green-500" />
                                Add Attendee
                            </h3>
                            <div className="space-y-4">
                                <ChurchMemberTypeahead
                                    churchId={event.church_id ?? user?.church_id}
                                    onSelect={(m) => setAttendingMember(m)}
                                    value={attendingMember}
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleAddAttendee}
                                        disabled={saving || !attendingMember}
                                        className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                                    >
                                        {saving ? (
                                            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                        ) : (
                                            <FontAwesomeIcon icon={faUserPlus} />
                                        )}
                                        Add Attendee
                                    </button>
                                    <button
                                        onClick={() => setAttendingMember(null)}
                                        className="px-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300 font-semibold rounded-2xl hover:shadow-lg transition-all duration-200"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Event Info Card */}
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Event Information</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Event ID</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">#{event.id}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Church ID</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">#{event.church_id}</span>
                                </div>
                                {event.created_at && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Created</span>
                                        <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                            {new Date(event.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                                {event.updated_at && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Last Updated</span>
                                        <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                            {new Date(event.updated_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {toast && <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </div>
        </div>
    )
}