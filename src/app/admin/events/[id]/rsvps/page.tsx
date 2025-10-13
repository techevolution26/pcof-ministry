// app/admin/events/[id]/rsvps/page.tsx
'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Toast from '@/components/Toast'
import ChurchMemberTypeahead from '@/components/ChurchMemberTypeahead'
import { fetchAdminEventById, fetchEventRsvps, createEventRsvp, deleteEventRsvp } from '@/lib/adminApi'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faArrowLeft,
    faDownload,
    faUsers,
    faCalendar,
    faChurch,
    faUserPlus,
    faTrash,
    faEye,
    faSpinner,
    faExclamationTriangle,
    faUserGroup,
    faChartBar,
    faCheckCircle,
    faClock,
    faTimesCircle
} from '@fortawesome/free-solid-svg-icons'

export default function EventRsvpsPage() {
    const { id } = useParams() as { id?: string }
    const router = useRouter()
    const [event, setEvent] = useState<any | null>(null)
    const [rsvps, setRsvps] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [addingMember, setAddingMember] = useState<any | null>(null)
    const [saving, setSaving] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [toast, setToast] = useState<any | null>(null)

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
                    setRsvps(Array.isArray(res) ? res : (res?.data ?? []))
                } catch (err: any) {
                    console.error(err)
                    router.replace('/admin/events')
                } finally {
                    if (mounted) setLoading(false)
                }
            })()
        return () => { mounted = false }
    }, [id, router])

    async function handleAdd() {
        if (!addingMember) {
            setToast({ show: true, message: 'Please select a member to add', type: 'error' })
            return
        }
        setSaving(true)
        try {
            const payload = {
                event_id: id,
                member_id: addingMember.id,
                church_id: event?.church_id ?? null,
                status: 'attending',
            }
            const res = await createEventRsvp(payload)
            const saved = res?.data ?? res
            setRsvps(prev => [saved, ...prev])
            setAddingMember(null)
            setToast({ show: true, message: 'Attendee added successfully', type: 'success' })
        } catch (err: any) {
            console.error(err)
            setToast({ show: true, message: err?.message ?? 'Failed to add attendee', type: 'error' })
        } finally {
            setSaving(false)
        }
    }

    async function handleRemove(rsvp: any) {
        if (!confirm('Are you sure you want to remove this attendee?')) return
        try {
            await deleteEventRsvp(rsvp.id)
            setRsvps(prev => prev.filter(x => x.id !== rsvp.id))
            setToast({ show: true, message: 'Attendee removed successfully', type: 'success' })
        } catch (err: any) {
            console.error(err)
            setToast({ show: true, message: err?.message ?? 'Failed to remove attendee', type: 'error' })
        }
    }

    // attendee counts
    const counts = rsvps.reduce((acc: any, r: any) => {
        const s = r.status ?? 'attending'
        acc[s] = (acc[s] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    function exportCsv(list: any[]) {
        if (!list || !list.length) {
            setToast({ show: true, message: 'No RSVPs to export', type: 'warning' })
            return
        }

        setExporting(true)
        try {
            const headers = ['ID', 'Member ID', 'Member Name', 'Status', 'Notes', 'Email', 'Phone', 'Church ID', 'Registration Date']
            const rows = list.map(r => [
                r.id ?? '',
                r.member_id ?? '',
                r.member ? `${r.member.first_name ?? ''} ${r.member.last_name ?? ''}`.trim() : (r.member_name ?? ''),
                r.status ?? '',
                (r.notes ?? '').replace(/\r?\n/g, ' '),
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
            a.download = `event-${id}-rsvps-${new Date().toISOString().split('T')[0]}.csv`
            a.click()
            URL.revokeObjectURL(url)
            setToast({ show: true, message: 'RSVPs exported successfully', type: 'success' })
        } catch (err) {
            console.error('Export failed', err)
            setToast({ show: true, message: 'Failed to export RSVPs', type: 'error' })
        } finally {
            setExporting(false)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'attending': return faCheckCircle
            case 'interested': return faClock
            case 'cancelled': return faTimesCircle
            default: return faUserGroup
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'attending': return 'text-green-600 dark:text-green-400'
            case 'interested': return 'text-yellow-600 dark:text-yellow-400'
            case 'cancelled': return 'text-red-600 dark:text-red-400'
            default: return 'text-gray-600 dark:text-gray-400'
        }
    }

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'attending': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            case 'interested': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
            case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-96"></div>
                        <div className="h-32 bg-gray-200 rounded"></div>
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
                        <p className="text-gray-600 dark:text-gray-300 mb-6">The event you're looking for doesn't exist.</p>
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
                                        Event RSVPs
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
                                href={`/admin/events/${id}/attendees`}
                                className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors duration-200 flex items-center gap-2 shadow-lg"
                            >
                                <FontAwesomeIcon icon={faUsers} />
                                View Attendees
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 dark:border-gray-700/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{rsvps.length}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Total RSVPs</div>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                <FontAwesomeIcon icon={faUserGroup} className="text-blue-600 dark:text-blue-400 text-xl" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 dark:border-gray-700/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{counts['attending'] ?? 0}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Attending</div>
                            </div>
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                                <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 dark:text-green-400 text-xl" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 dark:border-gray-700/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{counts['interested'] ?? 0}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Interested</div>
                            </div>
                            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                                <FontAwesomeIcon icon={faClock} className="text-yellow-600 dark:text-yellow-400 text-xl" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 dark:border-gray-700/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{counts['cancelled'] ?? 0}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Cancelled</div>
                            </div>
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                                <FontAwesomeIcon icon={faTimesCircle} className="text-red-600 dark:text-red-400 text-xl" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add Attendee Section */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                        <FontAwesomeIcon icon={faUserPlus} className="text-blue-500" />
                        Add Attendee
                    </h2>

                    <div className="flex flex-col lg:flex-row gap-4 items-start">
                        <div className="flex-1">
                            <ChurchMemberTypeahead
                                churchId={event.church_id ?? undefined}
                                onSelect={m => setAddingMember(m)}
                                value={addingMember}
                                placeholder="Search for church members..."
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleAdd}
                                disabled={saving || !addingMember}
                                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 transition-colors duration-200 flex items-center gap-2 shadow-lg"
                            >
                                <FontAwesomeIcon icon={saving ? faSpinner : faUserPlus} className={saving ? 'animate-spin' : ''} />
                                {saving ? 'Adding...' : 'Add Attendee'}
                            </button>
                            <button
                                onClick={() => setAddingMember(null)}
                                className="px-4 py-2.5 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors duration-200 flex items-center gap-2 backdrop-blur-sm"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                        Search and select church members to add them as event attendees
                    </p>
                </div>

                {/* RSVPs List */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                            <FontAwesomeIcon icon={faChartBar} className="text-purple-500" />
                            RSVP List ({rsvps.length})
                        </h2>
                    </div>

                    <div className="p-6">
                        {rsvps.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FontAwesomeIcon icon={faUserGroup} className="text-gray-400 text-2xl" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No RSVPs Yet</h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-6">
                                    No one has RSVP'd for this event yet. Start by adding attendees above.
                                </p>
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
                                                <FontAwesomeIcon
                                                    icon={getStatusIcon(rsvp.status)}
                                                    className={`text-white text-lg ${getStatusColor(rsvp.status)}`}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                                        {rsvp.member ? `${rsvp.member.first_name} ${rsvp.member.last_name}` : (rsvp.member_name ?? `Member #${rsvp.member_id}`)}
                                                    </h3>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(rsvp.status)}`}>
                                                        {rsvp.status}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                                                    {rsvp.member?.email && (
                                                        <span className="flex items-center gap-1">
                                                            {rsvp.member.email}
                                                        </span>
                                                    )}
                                                    {rsvp.notes && (
                                                        <span className="flex items-center gap-1">
                                                            Notes: {rsvp.notes}
                                                        </span>
                                                    )}
                                                    {rsvp.created_at && (
                                                        <span className="flex items-center gap-1">
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
                                            <button
                                                onClick={() => handleRemove(rsvp)}
                                                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                                                title="Remove RSVP"
                                            >
                                                <FontAwesomeIcon icon={faTrash} className="text-sm" />
                                            </button>
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