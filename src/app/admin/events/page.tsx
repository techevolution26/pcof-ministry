// app/admin/events/page.tsx
'use client'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { fetchAdminEvents, deleteAdminEvent, fetchChurchesList } from '@/lib/adminApi'
import Toast from '@/components/Toast'
import AdminEventCard from '@/components/AdminEventCard'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faPlus,
    faSearch,
    faFilter,
    faCalendar,
    faChurch,
    faGlobe,
    faBuilding,
    faSpinner,
    faExclamationTriangle,
    faArrowLeft,
    faArrowRight,
    faRefresh
} from '@fortawesome/free-solid-svg-icons'

export default function AdminEventsPage() {
    const { user } = useAdminAuth()
    const [events, setEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [toast, setToast] = useState<any | null>(null)

    // controls
    const [q, setQ] = useState('')
    const qRef = useRef('')
    const [scope, setScope] = useState<'all' | 'national' | 'church'>('all')
    const [churchId, setChurchId] = useState<string | number | ''>('')
    const [page, setPage] = useState<number>(1)
    const [perPage] = useState<number>(30)

    const [churches, setChurches] = useState<any[]>([])
    const [rowDeleting, setRowDeleting] = useState<Record<string, boolean>>({})
    const [refreshing, setRefreshing] = useState(false)

    // debounce search
    useEffect(() => { qRef.current = q }, [q])
    useEffect(() => {
        const t = setTimeout(() => load({ page: 1 }), 350)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q, scope, churchId])

    const buildQuery = useCallback(() => {
        const params = new URLSearchParams()
        if (qRef.current) params.set('q', qRef.current)
        if (scope === 'national') params.set('scope', 'national')
        if (scope === 'church' && churchId) params.set('church_id', String(churchId))
        params.set('page', String(page || 1))
        params.set('per_page', String(perPage))
        return params.toString() ? `?${params.toString()}` : ''
    }, [scope, churchId, page, perPage])

    const load = useCallback(async ({ page: p = 1, showRefreshing = false } = {}) => {
        if (showRefreshing) {
            setRefreshing(true)
        } else {
            setLoading(true)
        }
        setError(null)
        try {
            const qstr = buildQuery()
            const body = await fetchAdminEvents(qstr)
            const list = Array.isArray(body) ? body : (body?.data ?? [])
            setEvents(list)
        } catch (err: any) {
            console.error('load events failed', err)
            setError(err?.message ?? 'Failed to load events')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [buildQuery])

    useEffect(() => {
        let mounted = true
            ; (async () => {
                try {
                    const c = await fetchChurchesList()
                    if (!mounted) return
                    setChurches(Array.isArray(c) ? c : (c?.data ?? []))
                } catch (e) {
                    console.warn('failed to load churches', e)
                }
                await load({ page: 1 })
            })()
        return () => { mounted = false }
    }, [load])

    async function handleDelete(id: number) {
        if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return

        setRowDeleting(prev => ({ ...prev, [String(id)]: true }))
        const snapshot = events
        setEvents(prev => prev.filter(e => String(e.id) !== String(id)))

        try {
            await deleteAdminEvent(id)
            setToast({ show: true, message: 'Event deleted successfully', type: 'success' })
        } catch (err: any) {
            console.error('delete failed', err)
            setEvents(snapshot) // rollback
            setToast({
                show: true,
                message: err?.message ?? 'Failed to delete event. Please try again.',
                type: 'error'
            })
        } finally {
            setRowDeleting(prev => {
                const copy = { ...prev }
                delete copy[String(id)]
                return copy
            })
        }
    }

    const getScopeIcon = (scopeType: string) => {
        switch (scopeType) {
            case 'national': return faGlobe
            case 'church': return faChurch
            default: return faCalendar
        }
    }

    const getScopeColor = (scopeType: string) => {
        switch (scopeType) {
            case 'national': return 'text-purple-600 dark:text-purple-400'
            case 'church': return 'text-blue-600 dark:text-blue-400'
            default: return 'text-gray-600 dark:text-gray-400'
        }
    }

    // Enhanced loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="animate-pulse space-y-6">
                        {/* Header Skeleton */}
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-96"></div>
                            </div>
                            <div className="h-10 bg-gray-200 rounded w-32"></div>
                        </div>

                        {/* Filters Skeleton */}
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="h-12 bg-gray-200 rounded w-full md:w-1/3"></div>
                            <div className="h-12 bg-gray-200 rounded w-full md:w-48"></div>
                            <div className="h-12 bg-gray-200 rounded w-full md:w-48"></div>
                        </div>

                        {/* Events Grid Skeleton */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 shadow-sm border border-white/50 dark:border-gray-700/50">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="space-y-2 flex-1">
                                            <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                        </div>
                                        <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                                    </div>
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                                        <div className="flex gap-2">
                                            <div className="h-8 bg-gray-200 rounded w-16"></div>
                                            <div className="h-8 bg-gray-200 rounded w-16"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Enhanced error state
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 text-center shadow-xl">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 dark:text-red-400 text-2xl" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Unable to Load Events</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
                        <button
                            onClick={() => load({ page: 1 })}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 flex items-center gap-2 mx-auto"
                        >
                            <FontAwesomeIcon icon={faRefresh} />
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="space-y-3">
                            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                                Events Management
                            </h1>
                            <p className="text-lg text-gray-600 dark:text-gray-300 font-light">
                                Create and manage events across churches and national levels
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => load({ page: 1, showRefreshing: true })}
                                disabled={refreshing}
                                className="px-4 py-2.5 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 transition-colors duration-200 flex items-center gap-2 backdrop-blur-sm"
                            >
                                <FontAwesomeIcon icon={refreshing ? faSpinner : faRefresh} className={refreshing ? 'animate-spin' : ''} />
                                Refresh
                            </button>

                            <Link
                                href="/admin/events/new"
                                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
                            >
                                <FontAwesomeIcon icon={faPlus} />
                                Create Event
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="mb-6">
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 dark:border-gray-700/50">
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Search Input */}
                            <div className="flex-1 relative">
                                <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    value={q}
                                    onChange={(e) => { setQ(e.target.value); setPage(1) }}
                                    placeholder="Search events by title, location, or description..."
                                    className="w-full pl-12 pr-4 py-3 bg-transparent border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-gray-900 dark:text-white transition-colors duration-200"
                                />
                            </div>

                            {/* Scope Filter */}
                            <div className="relative">
                                <FontAwesomeIcon icon={faFilter} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                                <select
                                    value={scope}
                                    onChange={(e) => { setScope(e.target.value as any); setPage(1) }}
                                    className="pl-12 pr-8 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white appearance-none cursor-pointer transition-colors duration-200"
                                >
                                    <option value="all">All Events</option>
                                    <option value="national">National Events</option>
                                    <option value="church">Church Events</option>
                                </select>
                            </div>

                            {/* Church Filter */}
                            {scope === 'church' && (
                                <div className="relative">
                                    <FontAwesomeIcon icon={faChurch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                                    <select
                                        value={String(churchId)}
                                        onChange={(e) => { setChurchId(e.target.value); setPage(1) }}
                                        className="pl-12 pr-8 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white appearance-none cursor-pointer transition-colors duration-200"
                                    >
                                        <option value="">All Churches</option>
                                        {churches.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Active Filters Display */}
                        <div className="flex items-center gap-3 mt-4 flex-wrap">
                            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                <FontAwesomeIcon icon={getScopeIcon(scope)} className={getScopeColor(scope)} />
                                {scope === 'all' && 'Showing all events'}
                                {scope === 'national' && 'National events only'}
                                {scope === 'church' && (churchId ? `Events for selected church` : 'Church events')}
                            </span>
                            {q && (
                                <span className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faSearch} />
                                    Search: "{q}"
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Events Grid */}
                <div className="mb-8">
                    {events.length === 0 ? (
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-12 text-center shadow-lg border border-white/50 dark:border-gray-700/50">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FontAwesomeIcon icon={faCalendar} className="text-gray-400 text-2xl" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Events Found</h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                                {q || scope !== 'all' || churchId
                                    ? 'No events match your current filters. Try adjusting your search criteria.'
                                    : 'Get started by creating your first event for your church or organization.'
                                }
                            </p>
                            <Link
                                href="/admin/events/new"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 inline-flex items-center gap-2"
                            >
                                <FontAwesomeIcon icon={faPlus} />
                                Create First Event
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {events.map(event => (
                                <AdminEventCard
                                    key={event.id}
                                    events={[event]}
                                    onDelete={handleDelete}
                                    isDeleting={!!rowDeleting[String(event.id)]}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {events.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Showing {events.length} events
                            {page > 1 && ` • Page ${page}`}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => { if (page > 1) { setPage(p => p - 1); load({ page: Math.max(1, page - 1) }) } }}
                                disabled={page <= 1}
                                className="px-4 py-2 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2 backdrop-blur-sm"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} />
                                Previous
                            </button>

                            <div className="px-4 py-2 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium backdrop-blur-sm">
                                Page {page}
                            </div>

                            <button
                                onClick={() => { setPage(p => p + 1); load({ page: page + 1 }) }}
                                className="px-4 py-2 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors duration-200 flex items-center gap-2 backdrop-blur-sm"
                            >
                                Next
                                <FontAwesomeIcon icon={faArrowRight} />
                            </button>
                        </div>
                    </div>
                )}
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