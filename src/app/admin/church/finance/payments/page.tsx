'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { fetchPayments, approvePayment } from '@/lib/adminApi'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faArrowLeft,
    faPlus,
    faSearch,
    faEye,
    faCheck,
    faSpinner,
    faReceipt,
    faMoneyBillWave,
    faClock,
    faCheckCircle,
    faFileInvoice
} from '@fortawesome/free-solid-svg-icons'

export default function PaymentsList() {
    const router = useRouter()
    const { user, isLoading } = useAdminAuth()
    const [q, setQ] = useState('')
    const [page, setPage] = useState(1)
    const [items, setItems] = useState<any[]>([])
    const [meta, setMeta] = useState<any>({})
    const [loading, setLoading] = useState(true)
    const [approvingId, setApprovingId] = useState<string | number | null>(null)
    const churchId = user?.church_id

    useEffect(() => {
        let mounted = true
        async function load() {
            setLoading(true)
            try {
                const body = await fetchPayments({ q: q || undefined, church_id: churchId, page, per_page: 25 })
                if (!mounted) return
                const list = Array.isArray(body) ? body : (body?.data ?? body?.results ?? [])
                const pagination = body?.meta ?? { current_page: body?.current_page ?? page, last_page: body?.last_page ?? 1, total: body?.total ?? list.length }
                setItems(list)
                setMeta(pagination)
            } catch (err) { console.error(err) }
            finally { if (mounted) setLoading(false) }
        }
        load()
        return () => { mounted = false }
    }, [q, page, churchId])

    async function handleApprove(id: string | number) {
        setApprovingId(id)
        try {
            await approvePayment(id)
            // optimistic: update state
            setItems(prev => prev.map(i => i.id == id ? { ...i, status: 'approved' } : i))
        } catch (err: any) {
            alert(err?.message ?? 'Approve failed')
        } finally {
            setApprovingId(null)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'approved': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
            case 'pending': return 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30'
            case 'submitted': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30'
            default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30'
        }
    }

    const getTypeColor = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'tithe': return 'text-purple-600 dark:text-purple-400'
            case 'offering': return 'text-blue-600 dark:text-blue-400'
            case 'event_fee': return 'text-green-600 dark:text-green-400'
            case 'collection': return 'text-orange-600 dark:text-orange-400'
            default: return 'text-gray-600 dark:text-gray-400'
        }
    }

    if (isLoading) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50 dark:border-gray-700/50">
                    <FontAwesomeIcon icon={faSpinner} className="mx-auto mb-4 text-2xl text-blue-600 animate-spin" />
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Loading payments...</div>
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
                            Payments
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">
                            Manage and review all payment transactions
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Link
                            href="/admin/church/finance/payments/new"
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            <FontAwesomeIcon icon={faPlus} className="text-sm" />
                            <span className="text-sm font-medium">Record Payment</span>
                        </Link>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                            value={q}
                            onChange={e => { setQ(e.target.value); setPage(1) }}
                            placeholder="Search by reference, member, or description..."
                            className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                    </div>
                </div>

                {/* Payments Table */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 dark:border-gray-700/50 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-700">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center">
                                            <FontAwesomeIcon icon={faSpinner} className="mx-auto mb-2 text-blue-600 animate-spin text-lg" />
                                            <div className="text-sm text-gray-500 dark:text-gray-400">Loading payments...</div>
                                        </td>
                                    </tr>
                                ) : items.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                                    <FontAwesomeIcon icon={faFileInvoice} className="text-white text-xs" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white">
                                                        {payment.reference || `#${payment.id}`}
                                                    </div>
                                                    {payment.member && (
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {payment.member.first_name} {payment.member.last_name}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`capitalize font-medium ${getTypeColor(payment.type)}`}>
                                                {payment.type?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900 dark:text-white">
                                                {payment.amount} {payment.currency}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(payment.status)}`}>
                                                {payment.status === 'approved' && <FontAwesomeIcon icon={faCheckCircle} className="text-xs" />}
                                                {payment.status === 'pending' && <FontAwesomeIcon icon={faClock} className="text-xs" />}
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                {new Date(payment.created_at).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(payment.created_at).toLocaleTimeString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/admin/church/finance/payments/${payment.id}`}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-colors duration-200"
                                                >
                                                    <FontAwesomeIcon icon={faEye} className="text-xs" />
                                                    View
                                                </Link>
                                                {user?.role === 'church_admin' && payment.status === 'submitted' && (
                                                    <button
                                                        onClick={() => handleApprove(payment.id)}
                                                        disabled={approvingId === payment.id}
                                                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50"
                                                    >
                                                        {approvingId === payment.id ? (
                                                            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                                        ) : (
                                                            <FontAwesomeIcon icon={faCheck} />
                                                        )}
                                                        Approve
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && items.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                                <FontAwesomeIcon icon={faReceipt} className="text-4xl mb-4 text-gray-300 dark:text-gray-600" />
                                                <div className="text-lg font-medium mb-2">No payments found</div>
                                                <div className="text-sm mb-4">
                                                    {q ? 'Try adjusting your search terms' : 'Get started by recording your first payment'}
                                                </div>
                                                {!q && (
                                                    <Link
                                                        href="/admin/church/finance/payments/new"
                                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                                                    >
                                                        <FontAwesomeIcon icon={faPlus} />
                                                        Record Payment
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
                                    Showing {items.length} of {meta.total ?? items.length} payments
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