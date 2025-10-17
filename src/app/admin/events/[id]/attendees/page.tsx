// app/admin/events/[id]/attendees/page.tsx
'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { fetchAdminEventById, fetchEventRsvps } from '@/lib/adminApi'
import Toast from '@/components/Toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faArrowLeft,
    faDownload,
    faUsers,
    faCalendar,
    faChurch,
    faUser,
    faEnvelope,
    faPhone,
    faSpinner,
    faExclamationTriangle,
    faEye
} from '@fortawesome/free-solid-svg-icons'

export default function EventAttendeesPage() {
    const { id } = useParams() as { id?: string }
    const router = useRouter()
    const [event, setEvent] = useState<unknown | null>(null)
    const [rsvps, setRsvps] = useState<unknown[]>([])
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)
    const [toast, setToast] = useState<unknown | null>(null)

    useEffect(() => {
        if (!id) return
        let mounted = true
            ; (async () => {
                setLoading(true)
                try {
                    const ev = await fetchAdminEventById(id)
                    if (!mounted) return
                    setEvent(ev?.data ?? ev)
                    const res = await fetchEventRsvps(id)
                    if (!mounted) return
                    const list = Array.isArray(res) ? res : (res?.data ?? [])
                    setRsvps(list.filter((r: unknown) => (r.status ?? 'attending') === 'attending'))
                } catch (err: unknown) {
                    console.error(err)
                    router.replace('/admin/events')
                } finally {
                    if (mounted) setLoading(false)
                }
            })()
        return () => { mounted = false }
    }, [id, router])

    function exportCsv(list: unknown[]) {
        if (!list || !list.length) {
            setToast({ show: true, message: 'No attendees to export', type: 'warning' })
            return
        }

        setExporting(true)
        try {
            const headers = ['ID', 'Member ID', 'Member Name', 'Email', 'Phone', 'Church ID', 'Registration Date']
            const rows = list.map(r => [
                r.id ?? '',
                r.member_id ?? '',
                r.member ? `${r.member.first_name ?? ''} ${r.member.last_name ?? ''}`.trim() : (r.member_name ?? ''),
                r.member?.email ?? '',
                r.member?.phone ?? '',
                r.church_id ?? '',
                r.created_at ? new Date(r.created_at).toLocaleDateString() : '',
            ])
            const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
            const blob = new Blob([csv], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `event-${id}-attendees-${new Date().toISOString().split('T')[0]}.csv`
            a.click()
            URL.revokeObjectURL(url)
            setToast({ show: true, message: 'Attendees exported successfully', type: 'success' })
        } catch (err) {
            console.error('Export failed', err)
            setToast({ show: true, message: 'Failed to export attendees', type: 'error' })
        } finally {
            setExporting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-96"></div>
                        <div className="h-64 bg-gray-200 rounded"></div>
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
                        <p className="text-gray-600 dark:text-gray-300 mb-6">The event you&apos;re looking for doesn&apos;t exist.</p>
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Link
                                    href={`/admin/events/${id}`}
                                    className="w-10 h-10 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors duration-200 backdrop-blur-sm"
                                >
                                    <FontAwesomeIcon icon={faArrowLeft} className="text-gray-600 dark:text-gray-400" />
                                </Link>
                                <div>
                                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                                        Event Attendees
                                    </h1>
                                    <div className="text-lg text-gray-600 dark:text-gray-300 font-light">
                                        {event.title}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        <span className="flex items-center gap-2">
                                            <FontAwesomeIcon icon={faChurch} />
                                            {event.church?.name ?? (event.is_national ? 'National Event' : '—')}
                                        </span>
                                        {startDate && (
                                            <span className="flex items-center gap-2">
                                                <FontAwesomeIcon icon={faCalendar} />
                                                {startDate.toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => exportCsv(rsvps)}
                                disabled={exporting || rsvps.length === 0}
                                className="px-4 py-2.5 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 transition-colors duration-200 flex items-center gap-2 backdrop-blur-sm"
                            >
                                <FontAwesomeIcon icon={exporting ? faSpinner : faDownload} className={exporting ? 'animate-spin' : ''} />
                                {exporting ? 'Exporting...' : 'Export CSV'}
                            </button>

                            <Link
                                href={`/admin/events/${id}/rsvps`}
                                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors duration-200 flex items-center gap-2 shadow-lg"
                            >
                                <FontAwesomeIcon icon={faUsers} />
                                Manage RSVPs
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Attendees Count Card */}
                <div className="mb-6">
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 dark:border-gray-700/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                                    <FontAwesomeIcon icon={faUsers} className="text-green-600 dark:text-green-400 text-2xl" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{rsvps.length}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Confirmed Attendees</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-gray-500 dark:text-gray-400">Event Capacity</div>
                                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {event.capacity ? `${rsvps.length} / ${event.capacity}` : 'Unlimited'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Attendees List */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                            <FontAwesomeIcon icon={faUser} className="text-blue-500" />
                            Attendee List
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {rsvps.length} confirmed attendees for this event
                        </p>
                    </div>

                    <div className="p-6">
                        {rsvps.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FontAwesomeIcon icon={faUsers} className="text-gray-400 text-2xl" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Attendees Yet</h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-6">
                                    No one has confirmed their attendance for this event yet.
                                </p>
                                <Link
                                    href={`/admin/events/${id}/rsvps`}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 inline-flex items-center gap-2"
                                >
                                    <FontAwesomeIcon icon={faUsers} />
                                    Manage RSVPs
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {rsvps.map(rsvp => (
                                    <div
                                        key={rsvp.id}
                                        className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700/50 transition-colors duration-200"
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                                <FontAwesomeIcon icon={faUser} className="text-white text-lg" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                                        {rsvp.member ? `${rsvp.member.first_name} ${rsvp.member.last_name}` : (rsvp.member_name ?? `Member #${rsvp.member_id}`)}
                                                    </h3>
                                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
                                                        Confirmed
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                                                    {rsvp.member?.email && (
                                                        <span className="flex items-center gap-1">
                                                            <FontAwesomeIcon icon={faEnvelope} className="text-xs" />
                                                            {rsvp.member.email}
                                                        </span>
                                                    )}
                                                    {rsvp.member?.phone && (
                                                        <span className="flex items-center gap-1">
                                                            <FontAwesomeIcon icon={faPhone} className="text-xs" />
                                                            {rsvp.member.phone}
                                                        </span>
                                                    )}
                                                    {rsvp.created_at && (
                                                        <span className="flex items-center gap-1">
                                                            <FontAwesomeIcon icon={faCalendar} className="text-xs" />
                                                            Registered: {new Date(rsvp.created_at).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {rsvp.member_id && (
                                                <Link
                                                    href={`/admin/church/members/${rsvp.member_id}`}
                                                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
                                                    title="View Member"
                                                >
                                                    <FontAwesomeIcon icon={faEye} className="text-sm" />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
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