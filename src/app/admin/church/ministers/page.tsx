'use client'
import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { fetchMinistersList, deleteMinister } from '@/lib/adminApi'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faUserPlus,
    faSearch,
    faEye,
    faEdit,
    faTrash,
    faSpinner,
    faArrowLeft,
    faCheckCircle,
    faTimesCircle,
    faUserTie
} from '@fortawesome/free-solid-svg-icons'

type Minister = {
    id: number | string
    title?: string
    active?: boolean
    started_at?: string
    ended_at?: string
    member?: unknown
    designation?: unknown
    department?: unknown
    [k: string]: unknown
}

export default function MinistersListPage() {
    const { user } = useAdminAuth()
    const churchId = user?.church_id

    // list + meta
    const [ministers, setMinisters] = useState<Minister[]>([])
    const [meta, setMeta] = useState<{ current_page?: number; last_page?: number; per_page?: number; total?: number }>({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // controls
    const [q, setQ] = useState('')
    const [page, setPage] = useState<number>(1)
    const perPage = 25

    // deletion state
    const [deletingId, setDeletingId] = useState<number | string | null>(null)

    // bulk actions
    const [selectedMinisters, setSelectedMinisters] = useState<Set<number | string>>(new Set())
    const [bulkAction, setBulkAction] = useState<string>('')
    const [bulkLoading, setBulkLoading] = useState(false)

    // debounce ref
    const searchTimer = useRef<number | null>(null)

    // load initial data
    useEffect(() => {
        let mounted = true
        async function load() {
            setLoading(true)
            setError(null)
            try {
                if (!churchId) {
                    setMinisters([])
                    setMeta({})
                    return
                }

                const body = await fetchMinistersList({
                    church_id: churchId,
                    q: q || undefined,
                    page,
                    per_page: perPage
                })
                if (!mounted) return

                const list = Array.isArray(body) ? body : (body?.data ?? body?.results ?? [])
                const pagination = body?.meta ?? {
                    current_page: body?.current_page ?? body?.page ?? page,
                    last_page: body?.last_page ?? body?.lastPage ?? body?.last ?? 1,
                    per_page: body?.per_page ?? body?.perPage ?? perPage,
                    total: body?.total ?? (Array.isArray(list) ? list.length : 0),
                }

                setMinisters(list)
                setMeta({
                    current_page: Number(pagination.current_page ?? page),
                    last_page: Number(pagination.last_page ?? 1),
                    per_page: Number(pagination.per_page ?? perPage),
                    total: Number(pagination.total ?? (Array.isArray(list) ? list.length : 0)),
                })
            } catch (err: unknown) {
                console.error('Failed loading ministers', err)
                if (!mounted) return
                setError(err?.message ?? 'Failed to load ministers')
            } finally {
                if (mounted) setLoading(false)
            }
        }

        if (searchTimer.current) window.clearTimeout(searchTimer.current)
        searchTimer.current = window.setTimeout(() => {
            load()
        }, 200)

        return () => {
            mounted = false
            if (searchTimer.current) window.clearTimeout(searchTimer.current)
        }
    }, [churchId, q, page])

    // Selection handlers
    const toggleSelectMinister = (ministerId: number | string) => {
        setSelectedMinisters(prev => {
            const newSet = new Set(prev)
            if (newSet.has(ministerId)) {
                newSet.delete(ministerId)
            } else {
                newSet.add(ministerId)
            }
            return newSet
        })
    }

    const toggleSelectAll = () => {
        if (selectedMinisters.size === ministers.length) {
            setSelectedMinisters(new Set())
        } else {
            setSelectedMinisters(new Set(ministers.map(m => m.id)))
        }
    }

    // Bulk actions
    const handleBulkAction = async () => {
        if (selectedMinisters.size === 0 || !bulkAction) return

        if (bulkAction === 'delete') {
            const ok = window.confirm(`Are you sure you want to delete ${selectedMinisters.size} minister(s)? This action cannot be undone.`)
            if (!ok) return

            setBulkLoading(true)
            const ministerIds = Array.from(selectedMinisters)
            const prevMinisters = ministers

            // Optimistic update
            setMinisters(prev => prev.filter(m => !ministerIds.includes(m.id)))
            setMeta(prev => ({ ...prev, total: Math.max(0, Number(prev.total ?? 1) - ministerIds.length) }))
            setSelectedMinisters(new Set())

            try {
                await Promise.all(ministerIds.map(id => deleteMinister(id)))
            } catch (err: unknown) {
                // Restore on failure
                console.error('Bulk delete failed', err)
                setMinisters(prevMinisters)
                setMeta(prev => ({ ...prev, total: Number(prev.total ?? 0) + ministerIds.length }))
                setError(err?.message ?? 'Failed to delete ministers')
            } finally {
                setBulkLoading(false)
                setBulkAction('')
            }
        }
    }

    // delete handler
    async function handleDelete(minister: Minister) {
        const memberName = minister.member ?
            `${minister.member.first_name || ''} ${minister.member.last_name || ''}`.trim() :
            'Unknown Member'

        const ok = window.confirm(`Delete minister "${minister.title || 'Untitled'}" for ${memberName}? This cannot be undone.`)
        if (!ok) return

        const prev = ministers
        setDeletingId(minister.id)
        setMinisters(prevList => prevList.filter(m => String(m.id) !== String(minister.id)))
        setMeta(prevMeta => ({ ...prevMeta, total: Math.max(0, Number(prevMeta.total ?? 1) - 1) }))

        try {
            await deleteMinister(minister.id)
        } catch (err: unknown) {
            console.error('Delete failed', err)
            setMinisters(prev)
            setMeta(prevMeta => ({ ...prevMeta, total: Number(prevMeta.total ?? 0) + 1 }))
            setError(err?.message ?? 'Failed to delete minister')
        } finally {
            setDeletingId(null)
        }
    }

    // page navigation helpers
    const currentPage = Number(meta.current_page ?? page)
    const lastPage = Number(meta.last_page ?? page)

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
                                Church Ministers
                            </h1>
                            <p className="text-lg text-gray-600 dark:text-gray-300 font-light">
                                Manage and organize your church ministers
                            </p>
                        </div>
                        <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-3 shadow-sm">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <FontAwesomeIcon icon={faUserTie} className="text-white text-lg" />
                            </div>
                            <div className="hidden sm:block">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">Total Ministers</div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{meta.total ?? '0'}</div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Actions Bar */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Showing {ministers.length} of {meta.total ?? ministers.length} ministers
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative">
                            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                            <input
                                value={q}
                                onChange={(e) => { setQ(e.target.value); setPage(1) }}
                                placeholder="Search by name or title"
                                className="pl-10 pr-4 py-2 bg-white/80 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-full sm:w-64"
                            />
                        </div>
                        <Link
                            href="/admin/church/ministers/new"
                            className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                        >
                            <FontAwesomeIcon icon={faUserPlus} />
                            Add Minister
                        </Link>
                    </div>
                </div>

                {/* Bulk Actions Bar */}
                {selectedMinisters.size > 0 && (
                    <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <FontAwesomeIcon icon={faUserTie} className="text-blue-600 dark:text-blue-400" />
                                <span className="font-medium text-blue-800 dark:text-blue-200">
                                    {selectedMinisters.size} minister(s) selected
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <select
                                    value={bulkAction}
                                    onChange={(e) => setBulkAction(e.target.value)}
                                    className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Choose action...</option>
                                    <option value="delete">Delete Selected</option>
                                    <option value="export">Export Selected</option>
                                    <option value="assign_department">Assign to Department</option>
                                </select>
                                <button
                                    onClick={handleBulkAction}
                                    disabled={!bulkAction || bulkLoading}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-xl transition-all duration-200 flex items-center gap-2 disabled:cursor-not-allowed"
                                >
                                    {bulkLoading ? (
                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                    ) : (
                                        <FontAwesomeIcon icon={faCheckCircle} />
                                    )}
                                    Apply
                                </button>
                                <button
                                    onClick={() => setSelectedMinisters(new Set())}
                                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-all duration-200 flex items-center gap-2"
                                >
                                    <FontAwesomeIcon icon={faTimesCircle} />
                                    Clear
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Ministers Table */}
                <section>
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 overflow-hidden">
                        {loading ? (
                            // Skeleton Loading
                            <div className="p-6 space-y-4">
                                {Array.from({ length: 6 }).map((_, idx) => (
                                    <div key={`skeleton-${idx}`} className="flex items-center gap-4 p-4 bg-white/50 dark:bg-gray-700/50 rounded-2xl animate-pulse">
                                        <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-6"></div>
                                        <div className="h-10 bg-gray-200 dark:bg-gray-600 rounded-xl w-10"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
                                            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/4"></div>
                                        </div>
                                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
                                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
                                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
                                        <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                                    </div>
                                ))}
                            </div>
                        ) : ministers.length === 0 ? (
                            // Empty State
                            <div className="text-center py-12 px-6">
                                <FontAwesomeIcon
                                    icon={faUserTie}
                                    className="mx-auto text-4xl text-gray-400 dark:text-gray-500 mb-4"
                                />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    {q ? 'No ministers found' : 'No ministers yet'}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                                    {q ? 'Try adjusting your search criteria' : 'Get started by adding your first church minister.'}
                                </p>
                                <Link
                                    href="/admin/church/ministers/new"
                                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center gap-2"
                                >
                                    <FontAwesomeIcon icon={faUserPlus} />
                                    Add First Minister
                                </Link>
                            </div>
                        ) : (
                            // Ministers Table
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-gray-700">
                                            <th className="p-4 text-left">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedMinisters.size === ministers.length && ministers.length > 0}
                                                    onChange={toggleSelectAll}
                                                    className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                                />
                                            </th>
                                            <th className="p-4 text-sm font-semibold text-gray-900 dark:text-white">Minister</th>
                                            <th className="p-4 text-sm font-semibold text-gray-900 dark:text-white">Title</th>
                                            <th className="p-4 text-sm font-semibold text-gray-900 dark:text-white">Department</th>
                                            <th className="p-4 text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                                            <th className="p-4 text-sm font-semibold text-gray-900 dark:text-white text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {ministers.map(m => {
                                            const memberName = m.member ?
                                                `${m.member.first_name || ''} ${m.member.last_name || ''}`.trim() :
                                                'Unknown Member'
                                            return (
                                                <tr
                                                    key={m.id}
                                                    className="hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors duration-200 group"
                                                >
                                                    <td className="p-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedMinisters.has(m.id)}
                                                            onChange={() => toggleSelectMinister(m.id)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                                        />
                                                    </td>
                                                    <td
                                                        className="p-4 cursor-pointer"
                                                        onClick={() => { window.location.href = `/admin/church/ministers/${m.id}` }}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm">
                                                                {memberName ? `${memberName.charAt(0)}` : 'M'}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-gray-900 dark:text-white">{memberName || '—'}</div>
                                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                                    ID: {m.id}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td
                                                        className="p-4 cursor-pointer"
                                                        onClick={() => { window.location.href = `/admin/church/ministers/${m.id}` }}
                                                    >
                                                        <div className="text-gray-700 dark:text-gray-300">{m.title || '—'}</div>
                                                    </td>
                                                    <td
                                                        className="p-4 cursor-pointer"
                                                        onClick={() => { window.location.href = `/admin/church/ministers/${m.id}` }}
                                                    >
                                                        <div className="text-gray-700 dark:text-gray-300">
                                                            {m.department?.name || (m.department_id ? String(m.department_id) : '—')}
                                                        </div>
                                                    </td>
                                                    <td
                                                        className="p-4 cursor-pointer"
                                                        onClick={() => { window.location.href = `/admin/church/ministers/${m.id}` }}
                                                    >
                                                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${m.active
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                            }`}>
                                                            {m.active ? 'Active' : 'Inactive'}
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                            <Link
                                                                href={`/admin/church/ministers/${m.id}`}
                                                                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200 group/view"
                                                                title="View minister"
                                                            >
                                                                <FontAwesomeIcon icon={faEye} className="group-hover/view:scale-110 transition-transform" />
                                                            </Link>
                                                            <Link
                                                                href={`/admin/church/ministers/${m.id}/edit`}
                                                                className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-200 group/edit"
                                                                title="Edit minister"
                                                            >
                                                                <FontAwesomeIcon icon={faEdit} className="group-hover/edit:scale-110 transition-transform" />
                                                            </Link>
                                                            <button
                                                                onClick={() => handleDelete(m)}
                                                                disabled={deletingId === m.id}
                                                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 group/delete disabled:opacity-50 disabled:cursor-not-allowed"
                                                                title="Delete minister"
                                                            >
                                                                {deletingId === m.id ? (
                                                                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                                                ) : (
                                                                    <FontAwesomeIcon icon={faTrash} className="group-hover/delete:scale-110 transition-transform" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </section>

                {/* Pagination */}
                {ministers.length > 0 && (
                    <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Page {currentPage} of {lastPage} • {meta.total ?? ministers.length} total ministers
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => { setPage(1) }}
                                disabled={currentPage <= 1}
                                className="px-4 py-2 bg-white/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                            >
                                First
                            </button>
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={currentPage <= 1}
                                className="px-4 py-2 bg-white/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                            >
                                Previous
                            </button>

                            <div className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium">
                                {currentPage}
                            </div>

                            <button
                                onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                                disabled={currentPage >= lastPage}
                                className="px-4 py-2 bg-white/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                            >
                                Next
                            </button>
                            <button
                                onClick={() => setPage(lastPage)}
                                disabled={currentPage >= lastPage}
                                className="px-4 py-2 bg-white/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                            >
                                Last
                            </button>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
                        <div className="flex items-center gap-3 text-red-800 dark:text-red-200">
                            <FontAwesomeIcon icon={faTimesCircle} />
                            <span>{error}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}