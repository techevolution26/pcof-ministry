'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { fetchReconciliationById } from '@/lib/adminApi'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import ReconciliationForm from '@/components/ReconciliationForm'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faArrowLeft,
    faFileInvoice,
    faEdit,
    faMoneyBillWave,
    faCalendar,
    faCheckCircle,
    faClock,
    faExclamationTriangle,
    faSpinner,
    faIdCard,
    faFileAlt
} from '@fortawesome/free-solid-svg-icons'

export default function ReconciliationShowPage() {
    const params = useParams()
    const rawId = Array.isArray(params?.id) ? params?.id[0] : params?.id
    const id = rawId ?? null
    const router = useRouter()
    const { user, isLoading } = useAdminAuth()

    const [rec, setRec] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)

    useEffect(() => {
        let mounted = true
        async function load() {
            setLoading(true)
            try {
                if (!id) return
                const res = await fetchReconciliationById(id)
                if (!mounted) return
                setRec(res?.data ?? res)
            } catch (err) {
                console.error(err)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        if (!isLoading) load()
        return () => { mounted = false }
    }, [id, isLoading])

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

    if (isLoading || loading) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50 dark:border-gray-700/50">
                    <FontAwesomeIcon icon={faSpinner} className="mx-auto mb-4 text-2xl text-blue-600 animate-spin" />
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Loading reconciliation details...</div>
                </div>
            </div>
        </div>
    )

    if (!rec) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50 dark:border-gray-700/50">
                    <div className="text-gray-600 dark:text-gray-400 text-center mb-4">Reconciliation not found</div>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 mx-auto text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        Go Back to Reconciliations
                    </button>
                </div>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
                    <div className="space-y-2">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                            Back to Reconciliations
                        </button>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                            Reconciliation #{rec.id}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">
                            {rec.statement_reference || 'Bank statement reconciliation'}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Link
                            href="/admin/church/finance/reconciliations"
                            className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                            <span className="text-sm font-medium">All Reconciliations</span>
                        </Link>
                        {!editing && (
                            <button
                                onClick={() => setEditing(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                <FontAwesomeIcon icon={faEdit} className="text-sm" />
                                <span className="text-sm font-medium">Edit</span>
                            </button>
                        )}
                    </div>
                </div>

                {!editing ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Details */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Basic Information Card */}
                            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                                    <FontAwesomeIcon icon={faFileInvoice} className="text-blue-500" />
                                    Reconciliation Details
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                            Status
                                        </label>
                                        <div className="mt-1">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(rec.status)}`}>
                                                <FontAwesomeIcon icon={getStatusIcon(rec.status)} />
                                                {rec.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                            Reconciliation ID
                                        </label>
                                        <div className="mt-1 flex items-center gap-2 text-gray-900 dark:text-white">
                                            <FontAwesomeIcon icon={faIdCard} className="text-gray-400 text-sm" />
                                            <span className="font-mono">#{rec.id}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                            Statement Reference
                                        </label>
                                        <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                                            {rec.statement_reference || '—'}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                            Statement Amount
                                        </label>
                                        <div className="mt-1 flex items-center gap-2 text-gray-900 dark:text-white">
                                            <FontAwesomeIcon icon={faMoneyBillWave} className="text-green-500" />
                                            <span className="text-lg font-semibold">{rec.statement_amount || '—'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        Statement Date
                                    </label>
                                    <div className="mt-1 flex items-center gap-2 text-gray-900 dark:text-white">
                                        <FontAwesomeIcon icon={faCalendar} className="text-gray-400" />
                                        {rec.statement_date || '—'}
                                    </div>
                                </div>
                            </div>

                            {/* Payment Information */}
                            {rec.payment && (
                                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                                        <FontAwesomeIcon icon={faMoneyBillWave} className="text-green-500" />
                                        Associated Payment
                                    </h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                Payment Reference
                                            </label>
                                            <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                                                {rec.payment.reference || `#${rec.payment.id}`}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                Payment Amount
                                            </label>
                                            <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                                                {rec.payment.amount} {rec.payment.currency}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                            Payment Type
                                        </label>
                                        <div className="mt-1 text-gray-900 dark:text-white capitalize">
                                            {rec.payment.type}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                                    <FontAwesomeIcon icon={faFileAlt} className="text-gray-500" />
                                    Notes
                                </h2>

                                <div className="mt-2 p-4 bg-white/50 dark:bg-gray-700/50 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
                                    {rec.notes ? (
                                        <div className="text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                                            {typeof rec.notes === 'string' ? rec.notes : JSON.stringify(rec.notes)}
                                        </div>
                                    ) : (
                                        <div className="text-gray-500 dark:text-gray-400 italic text-center py-4">
                                            No notes provided for this reconciliation
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Quick Actions */}
                            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Quick Actions
                                </h3>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => setEditing(true)}
                                        className="w-full flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group"
                                    >
                                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-700 transition-colors">
                                            <FontAwesomeIcon icon={faEdit} className="text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-blue-900 dark:text-blue-100">Edit Reconciliation</div>
                                            <div className="text-sm text-blue-700 dark:text-blue-300">Update reconciliation details</div>
                                        </div>
                                    </button>

                                    <Link
                                        href="/admin/church/finance/reconciliations"
                                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200/50 dark:border-gray-600/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                                    >
                                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-500 transition-colors">
                                            <FontAwesomeIcon icon={faFileInvoice} className="text-gray-600 dark:text-gray-400" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-gray-100">All Reconciliations</div>
                                            <div className="text-sm text-gray-700 dark:text-gray-300">View all reconciliations</div>
                                        </div>
                                    </Link>
                                </div>
                            </div>

                            {/* Status Overview */}
                            <div className={`backdrop-blur-sm rounded-2xl shadow-xl border p-6 ${rec.status === 'reconciled'
                                    ? 'bg-green-50/80 dark:bg-green-900/20 border-green-200/50 dark:border-green-700/50'
                                    : rec.status === 'pending'
                                        ? 'bg-amber-50/80 dark:bg-amber-900/20 border-amber-200/50 dark:border-amber-700/50'
                                        : 'bg-red-50/80 dark:bg-red-900/20 border-red-200/50 dark:border-red-700/50'
                                }`}>
                                <h3 className="text-lg font-semibold mb-4">
                                    {rec.status === 'reconciled' ? 'Reconciled' :
                                        rec.status === 'pending' ? 'Pending Review' : 'Attention Needed'}
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Created</span>
                                        <span>{rec.created_at ? new Date(rec.created_at).toLocaleDateString() : 'Unknown'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Last Updated</span>
                                        <span>{rec.updated_at ? new Date(rec.updated_at).toLocaleDateString() : 'Unknown'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 dark:border-gray-700/50 p-8">
                        <ReconciliationForm initial={rec} churchId={user?.church_id} onSaved={() => {
                            setEditing(false)
                            router.replace(`/admin/church/finance/reconciliations/${rec.id}`)
                        }} />
                    </div>
                )}
            </div>
        </div>
    )
}