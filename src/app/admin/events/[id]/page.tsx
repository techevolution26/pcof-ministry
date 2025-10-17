// app/admin/events/[id]/page.tsx
'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Toast from '@/components/Toast'
import { fetchAdminEventById, deleteAdminEvent } from '@/lib/adminApi'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faArrowLeft,
    faEdit,
    faTrash,
    faCalendar,
    faMapMarkerAlt,
    faUsers,
    faGlobe,
    faChurch,
    faBuilding,
    faClock,
    faUserGroup,
    faListCheck,
    faMoneyBillWave,
    faSpinner,
    faExclamationTriangle,
    faImage,
    faChartLine
} from '@fortawesome/free-solid-svg-icons'

export default function EventShow() {
    const { id } = useParams() as { id?: string }
    const router = useRouter()
    const [event, setEvent] = useState<unknown | null>(null)
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState(false)
    const [toast, setToast] = useState<unknown | null>(null)

    useEffect(() => {
        if (!id) return
        let mounted = true
            ; (async () => {
                setLoading(true)
                try {
                    const body = await fetchAdminEventById(id)
                    if (!mounted) return
                    setEvent(body?.data ?? body)
                } catch (err: unknown) {
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
        if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return
        setDeleting(true)
        try {
            await deleteAdminEvent(event.id)
            setToast({ show: true, message: 'Event deleted successfully', type: 'success' })
            setTimeout(() => router.push('/admin/events'), 1000)
        } catch (err: unknown) {
            console.error('delete failed', err)
            setToast({ show: true, message: err?.message ?? 'Failed to delete event', type: 'error' })
        } finally {
            setDeleting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-96"></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 h-96 bg-gray-200 rounded"></div>
                            <div className="h-64 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!event) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 text-center shadow-xl">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 dark:text-red-400 text-2xl" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Event Not Found</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">The event you&apos;re looking for doesn&apos;t exist or has been removed.</p>
                        <Link
                            href="/admin/events"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 inline-flex items-center gap-2"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} />
                            Back to Events
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    const startDate = event.starts_at ? new Date(event.starts_at) : null
    const endDate = event.ends_at ? new Date(event.ends_at) : null

    const formatDateTime = (date: Date) => {
        return date.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/admin/events"
                                    className="w-10 h-10 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors duration-200 backdrop-blur-sm"
                                >
                                    <FontAwesomeIcon icon={faArrowLeft} className="text-gray-600 dark:text-gray-400" />
                                </Link>
                                <div>
                                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                                        {event.title}
                                    </h1>
                                    <div className="flex items-center gap-4 text-lg text-gray-600 dark:text-gray-300 font-light mt-2">
                                        <span className="flex items-center gap-2">
                                            <FontAwesomeIcon icon={event.is_national ? faGlobe : faChurch} className="text-blue-500" />
                                            {event.church?.name ?? (event.is_national ? 'National Event' : '—')}
                                        </span>
                                        {startDate && (
                                            <span className="flex items-center gap-2">
                                                <FontAwesomeIcon icon={faCalendar} className="text-green-500" />
                                                {formatDateTime(startDate)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link
                                href={`/admin/events/${event.id}/edit`}
                                className="px-4 py-2.5 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors duration-200 flex items-center gap-2 backdrop-blur-sm"
                            >
                                <FontAwesomeIcon icon={faEdit} />
                                Edit Event
                            </Link>

                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl disabled:opacity-50 transition-colors duration-200 flex items-center gap-2 shadow-lg"
                            >
                                <FontAwesomeIcon icon={deleting ? faSpinner : faTrash} className={deleting ? 'animate-spin' : ''} />
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Event Image */}
                        {event.image_url || event.image_path ? (
                            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 overflow-hidden">
                                <img
                                    src={event.image_url ?? event.image_path}
                                    alt={event.title}
                                    className="w-full h-80 object-cover"
                                />
                            </div>
                        ) : (
                            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 p-12 text-center">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FontAwesomeIcon icon={faImage} className="text-gray-400 text-2xl" />
                                </div>
                                <p className="text-gray-500 dark:text-gray-400">No event image available</p>
                            </div>
                        )}

                        {/* Event Details */}
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                                <FontAwesomeIcon icon={faCalendar} className="text-blue-500" />
                                Event Details
                            </h2>

                            {/* Description */}
                            {event.description && (
                                <div className="prose dark:prose-invert max-w-none mb-6">
                                    <div dangerouslySetInnerHTML={{ __html: event.description }} />
                                </div>
                            )}

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    {/* Date & Time */}
                                    {startDate && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                                <FontAwesomeIcon icon={faClock} className="text-blue-500" />
                                                Date & Time
                                            </label>
                                            <div className="text-gray-900 dark:text-white">
                                                <div className="font-medium">{formatDateTime(startDate)}</div>
                                                {endDate && (
                                                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                        Ends: {formatDateTime(endDate)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Location */}
                                    {event.location && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-red-500" />
                                                Location
                                            </label>
                                            <div className="text-gray-900 dark:text-white">{event.location}</div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {/* Capacity */}
                                    {event.capacity && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                                <FontAwesomeIcon icon={faUsers} className="text-green-500" />
                                                Capacity
                                            </label>
                                            <div className="text-gray-900 dark:text-white">{event.capacity} attendees</div>
                                        </div>
                                    )}

                                    {/* Scope */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                            <FontAwesomeIcon icon={event.is_national ? faGlobe : faBuilding} className="text-purple-500" />
                                            Scope
                                        </label>
                                        <div className="text-gray-900 dark:text-white">
                                            {event.is_national ? 'National Event' : (event.church_id ? 'Church Event' : '—')}
                                        </div>
                                    </div>

                                    {/* Online Status */}
                                    {event.online && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                                <FontAwesomeIcon icon={faGlobe} className="text-green-500" />
                                                Event Type
                                            </label>
                                            <div className="text-gray-900 dark:text-white">Online Event</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                                    <FontAwesomeIcon icon={faListCheck} className="text-blue-500" />
                                    Quick Actions
                                </h3>
                            </div>
                            <div className="p-4 space-y-3">
                                <Link
                                    href={`/admin/events/${event.id}/rsvps`}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors duration-200 border border-gray-200 dark:border-gray-600"
                                >
                                    <FontAwesomeIcon icon={faUserGroup} className="text-blue-500" />
                                    <div>
                                        <div className="font-medium">Manage RSVPs</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Handle attendee registrations</div>
                                    </div>
                                </Link>

                                <Link
                                    href={`/admin/events/${event.id}/attendees`}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-colors duration-200 border border-gray-200 dark:border-gray-600"
                                >
                                    <FontAwesomeIcon icon={faUsers} className="text-green-500" />
                                    <div>
                                        <div className="font-medium">View Attendees</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">See confirmed attendees</div>
                                    </div>
                                </Link>

                                <Link
                                    href={`/admin/finance/payments/new?event_id=${event.id}`}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-colors duration-200 border border-gray-200 dark:border-gray-600"
                                >
                                    <FontAwesomeIcon icon={faMoneyBillWave} className="text-purple-500" />
                                    <div>
                                        <div className="font-medium">Record Payment</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">For this event</div>
                                    </div>
                                </Link>
                            </div>
                        </div>

                        {/* Event Stats */}
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                                <FontAwesomeIcon icon={faChartLine} className="text-orange-500" />
                                Event Info
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
                                        Active
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Type</span>
                                    <span className="text-sm text-gray-900 dark:text-white">
                                        {event.is_national ? 'National' : 'Church'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Format</span>
                                    <span className="text-sm text-gray-900 dark:text-white">
                                        {event.online ? 'Online' : 'In-person'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {toast && (
                <Toast
                    show={toast.show}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    )
}