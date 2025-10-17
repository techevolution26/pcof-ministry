'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { fetchReconciliations, deleteReconciliation } from '@/lib/adminApi'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faArrowLeft,
    faPlus,
    faSearch,
    faFileInvoice,
    faEye,
    faTrash,
    faSpinner,
    faMoneyBillWave,
    faCalendar,
    faCheckCircle,
    faClock,
    faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons'

export default function ReconciliationsListPage() {
    const router = useRouter()
    const { user, isLoading } = useAdminAuth()
    const churchId = user?.church_id
    const [items, setItems] = useState<unknown[]>([])
    const [meta, setMeta] = useState<unknown>({})
    const [loading, setLoading] = useState(true)
    const [q, setQ] = useState('')
    const [page, setPage] = useState(1)
    const [status, setStatus] = useState<string | undefined>(undefined)
    const [deletingId, setDeletingId] = useState<string | number | null>(null)

    useEffect(() => {
        let mounted = true
        async function load() {
            setLoading(true)
            try {
                const res = await fetchReconciliations({ church_id: churchId, q: q || undefined, page, per_page: 25, status })
                const list = Array.isArray(res) ? res : (res?.data ?? [])
                const pagination = res?.meta ?? { current_page: res?.current_page ?? page, last_page: res?.last_page ?? 1, total: res?.total ?? list.length }
                if (!mounted) return
                setItems(list)
                setMeta(pagination)
            } catch (err) {
                console.error(err)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        if (!isLoading) load()
        return () => { mounted = false }
    }, [churchId, q, page, status, isLoading])

    async function handleDelete(id: number | string) {
        if (!confirm('Are you sure you want to delete this reconciliation? This action cannot be undone.')) return
        setDeletingId(id)
        try {
            await deleteReconciliation(id)
            setItems(prev => prev.filter(i => i.id !== id))
            setMeta(prev => ({ ...prev, total: Math.max(0, (prev.total ?? 1) - 1) }))
        } catch (err: unknown) {
            alert(err?.message ?? 'Delete failed')
        } finally {
            setDeletingId(null)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'reconciled': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
            case 'pending': return 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30'
            case 'unmatched': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
            default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'reconciled': return faCheckCircle
            case 'pending': return faClock
            case 'unmatched': return faExclamationTriangle
            default: return faFileInvoice
        }
    }

    if (isLoading) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50 dark:border-gray-700/50">
                    <FontAwesomeIcon icon={faSpinner} className="mx-auto mb-4 text-2xl text-blue-600 animate-spin" />
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Verifying session...</div>
                </div>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
                    <div className="space-y-2">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                            Back to Finance
                        </button>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                            Reconciliations
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">
                            Manage payment reconciliations and bank statement matching
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Link
                            href="/admin/church/finance/reconciliations/new"
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            <FontAwesomeIcon icon={faPlus} className="text-sm" />
                            <span className="text-sm font-medium">New Reconciliation</span>
                        </Link>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                            value={q}
                            onChange={e => { setQ(e.target.value); setPage(1) }}
                            placeholder="Search by reference or notes..."
                            className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                    </div>
                    <select
                        value={status ?? ''}
                        onChange={e => { setStatus(e.target.value || undefined); setPage(1) }}
                        className="px-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="reconciled">Reconciled</option>
                        <option value="unmatched">Unmatched</option>
                    </select>
                </div>

                {/* Reconciliations Table */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 dark:border-gray-700/50 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-700">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reconciliation</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reference</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center">
                                            <FontAwesomeIcon icon={faSpinner} className="mx-auto mb-2 text-blue-600 animate-spin text-lg" />
                                            <div className="text-sm text-gray-500 dark:text-gray-400">Loading reconciliations...</div>
                                        </td>
                                    </tr>
                                ) : items.map((reconciliation) => (
                                    <tr key={reconciliation.id} className="hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                                    <FontAwesomeIcon icon={faFileInvoice} className="text-white text-xs" />
                                                </div>
                                                <div className="font-medium text-gray-900 dark:text-white">
                                                    #{reconciliation.id}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                {reconciliation.payment ? (reconciliation.payment.reference ?? `#${reconciliation.payment.id}`) : '—'}
                                            </div>
                                            {reconciliation.payment && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {reconciliation.payment.amount} {reconciliation.payment.currency}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                {reconciliation.statement_reference || '—'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <FontAwesomeIcon icon={faMoneyBillWave} className="text-green-500 text-sm" />
                                                <div className="font-semibold text-gray-900 dark:text-white">
                                                    {reconciliation.statement_amount || '—'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                                                <FontAwesomeIcon icon={faCalendar} className="text-gray-400 text-xs" />
                                                {reconciliation.statement_date || '—'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(reconciliation.status)}`}>
                                                <FontAwesomeIcon icon={getStatusIcon(reconciliation.status)} className="text-xs" />
                                                {reconciliation.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/admin/church/finance/reconciliations/${reconciliation.id}`}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-colors duration-200"
                                                >
                                                    <FontAwesomeIcon icon={faEye} className="text-xs" />
                                                    View
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(reconciliation.id)}
                                                    disabled={deletingId === reconciliation.id}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white/50 dark:bg-gray-700/50 border border-red-200/50 dark:border-red-600/50 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 disabled:opacity-50"
                                                >
                                                    {deletingId === reconciliation.id ? (
                                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />
                                                    ) : (
                                                        <FontAwesomeIcon icon={faTrash} className="text-xs" />
                                                    )}
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && items.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                                <FontAwesomeIcon icon={faFileInvoice} className="text-4xl mb-4 text-gray-300 dark:text-gray-600" />
                                                <div className="text-lg font-medium mb-2">No reconciliations found</div>
                                                <div className="text-sm mb-4">
                                                    {q || status ? 'Try adjusting your search terms or filters' : 'Get started by creating your first reconciliation'}
                                                </div>
                                                {!q && !status && (
                                                    <Link
                                                        href="/admin/church/finance/reconciliations/new"
                                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                                                    >
                                                        <FontAwesomeIcon icon={faPlus} />
                                                        Create Reconciliation
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!loading && items.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Showing {items.length} of {meta.total ?? items.length} reconciliations
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={(meta.current_page ?? 1) <= 1}
                                        onClick={() => setPage(1)}
                                        className="px-3 py-1.5 bg-white/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 rounded-lg text-sm text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-700 transition-colors"
                                    >
                                        First
                                    </button>
                                    <button
                                        disabled={(meta.current_page ?? 1) <= 1}
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        className="px-3 py-1.5 bg-white/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 rounded-lg text-sm text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <div className="px-3 py-1.5 bg-white/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                                        {meta.current_page ?? 1} / {meta.last_page ?? 1}
                                    </div>
                                    <button
                                        disabled={(meta.current_page ?? 1) >= (meta.last_page ?? 1)}
                                        onClick={() => setPage(p => Math.min(meta.last_page ?? 1, p + 1))}
                                        className="px-3 py-1.5 bg-white/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 rounded-lg text-sm text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}