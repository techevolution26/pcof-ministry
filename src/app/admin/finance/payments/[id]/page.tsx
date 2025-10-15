// app/admin/finance/payments/[id]/page.tsx
'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Toast from '@/components/Toast'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { fetchPaymentById, approvePayment, createReconciliation } from '@/lib/adminApi'
import ReconciliationForm from '@/components/ReconciliationForm'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faArrowLeft,
    faCheckCircle,
    faTimesCircle,
    faHourglassHalf,
    faFileInvoice,
    faMoneyBillWave,
    faUser,
    faChurch,
    faCreditCard,
    faCalendar,
    faFileText,
    faReceipt,
    faDownload,
    faShare,
    faEllipsisVertical,
    faSpinner,
    faExclamationTriangle,
    faCheck,
    faClock,
    faHashtag,
    faPlus,
    faRefresh,
    faEye,
    faEdit,
    faTimes
} from '@fortawesome/free-solid-svg-icons'

export default function PaymentDetailsPage() {
    const params = useParams()
    const rawId = Array.isArray(params?.id) ? params?.id[0] : params?.id
    const id = rawId ?? null
    const router = useRouter()
    const { user, isLoading } = useAdminAuth()

    const [payment, setPayment] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [toast, setToast] = useState<any>(null)
    const [approving, setApproving] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [showReconciliationForm, setShowReconciliationForm] = useState(false)

    useEffect(() => {
        let mounted = true
        async function load() {
            if (!id) return
            setLoading(true)
            try {
                const body = await fetchPaymentById(id)
                if (!mounted) return
                const p = body?.data ?? body
                setPayment(p)
            } catch (err: any) {
                console.error(err)
                if (!mounted) return
                setError(err?.message ?? 'Failed to load payment details')
            } finally {
                if (mounted) setLoading(false)
            }
        }
        if (!isLoading) load()
        return () => { mounted = false }
    }, [id, isLoading])

    const refreshPayment = async () => {
        if (!id) return
        setRefreshing(true)
        try {
            const body = await fetchPaymentById(id)
            const p = body?.data ?? body
            setPayment(p)
        } catch (err: any) {
            console.error('Failed to refresh payment', err)
        } finally {
            setRefreshing(false)
        }
    }

    async function handleApprove() {
        if (!payment) return
        if (!window.confirm('Are you sure you want to approve this payment? This action cannot be undone.')) return
        setApproving(true)
        try {
            const body = await approvePayment(payment.id)
            const p = body?.data ?? body
            setPayment(p)
            setToast({ show: true, message: 'Payment approved successfully', type: 'success' })
        } catch (err: any) {
            console.error(err)
            setToast({ show: true, message: err?.message ?? 'Failed to approve payment', type: 'error' })
        } finally {
            setApproving(false)
        }
    }

    async function handleReconciliationCreated(rec: any) {
        try {
            await refreshPayment()
            setShowReconciliationForm(false)
            setToast({ show: true, message: 'Reconciliation record created successfully', type: 'success' })
        } catch {
            setToast({ show: true, message: 'Reconciliation created but failed to refresh', type: 'warning' })
        }
    }

    const getStatusIcon = (status: string) => {
        const statusIcons: Record<string, any> = {
            completed: faCheckCircle,
            pending: faHourglassHalf,
            failed: faTimesCircle,
            submitted: faClock,
            approved: faCheckCircle,
            rejected: faTimesCircle
        }
        return statusIcons[status?.toLowerCase()] || faFileInvoice
    }

    const getStatusColor = (status: string) => {
        const statusColors: Record<string, string> = {
            completed: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
            failed: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
            submitted: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
            approved: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
            rejected: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
        }
        return statusColors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700'
    }

    const getTypeIcon = (type: string) => {
        const typeIcons: Record<string, any> = {
            tithe: faMoneyBillWave,
            offering: faFileInvoice,
            collection: faMoneyBillWave,
            event_fee: faCalendar,
            donation: faMoneyBillWave
        }
        return typeIcons[type?.toLowerCase()] || faFileInvoice
    }

    const getTypeColor = (type: string) => {
        const typeColors: Record<string, string> = {
            tithe: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
            offering: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
            collection: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
            event_fee: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
            donation: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800'
        }
        return typeColors[type?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700'
    }

    // Loading state
    if (isLoading || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8 flex items-center justify-center">
                <div className="text-center">
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl text-blue-600 mb-4" />
                    <div className="text-lg font-medium text-gray-600 dark:text-gray-400">Loading payment details...</div>
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 text-center shadow-xl border border-white/50 dark:border-gray-700/50">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 dark:text-red-400 text-2xl" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Payment Not Found</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => router.back()}
                                className="px-6 py-3 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors duration-200 flex items-center gap-2"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} />
                                Go Back
                            </button>
                            <Link
                                href="/admin/finance/payments"
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors duration-200 flex items-center gap-2"
                            >
                                View All Payments
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!payment) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-lg font-medium text-gray-600 dark:text-gray-400">Payment not found</div>
                </div>
            </div>
        )
    }

    // Helper to get event image or payment file
    const imageUrl = payment?.image_url ?? payment?.file_url ?? payment?.metadata?.image_url

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/admin/finance/payments"
                                    className="w-10 h-10 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors duration-200 backdrop-blur-sm"
                                >
                                    <FontAwesomeIcon icon={faArrowLeft} className="text-gray-600 dark:text-gray-400" />
                                </Link>
                                <div>
                                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                                        Payment Details
                                    </h1>
                                    <p className="text-lg text-gray-600 dark:text-gray-300 font-light">
                                        {payment.reference ? `Reference: ${payment.reference}` : `ID: ${payment.id}`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={refreshPayment}
                                disabled={refreshing}
                                className="px-4 py-2.5 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 transition-colors duration-200 flex items-center gap-2 backdrop-blur-sm"
                            >
                                <FontAwesomeIcon icon={refreshing ? faSpinner : faRefresh} className={refreshing ? 'animate-spin' : ''} />
                                {refreshing ? 'Refreshing...' : 'Refresh'}
                            </button>

                            {payment.status === 'submitted' && (
                                <button
                                    onClick={handleApprove}
                                    disabled={approving}
                                    className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl disabled:opacity-50 transition-colors duration-200 flex items-center gap-2 shadow-lg"
                                >
                                    <FontAwesomeIcon icon={approving ? faSpinner : faCheckCircle} className={approving ? 'animate-spin' : ''} />
                                    {approving ? 'Approving...' : 'Approve Payment'}
                                </button>
                            )}

                            <Link
                                href={`/admin/finance/payments/${payment.id}/edit`}
                                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors duration-200 flex items-center gap-2"
                            >
                                <FontAwesomeIcon icon={faEdit} />
                                Edit
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    {/* Main Content - 3 columns */}
                    <div className="xl:col-span-3 space-y-6">
                        {/* Payment Overview Card */}
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                                    <FontAwesomeIcon icon={faFileInvoice} className="text-blue-500" />
                                    Payment Overview
                                </h2>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {/* Amount Card */}
                                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                                        <div className="flex items-center justify-between mb-4">
                                            <FontAwesomeIcon icon={faMoneyBillWave} className="text-2xl opacity-80" />
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm ${getStatusColor(payment.status)}`}>
                                                <FontAwesomeIcon icon={getStatusIcon(payment.status)} className="mr-1" />
                                                {payment.status}
                                            </span>
                                        </div>
                                        <div className="text-3xl font-bold mb-1">
                                            {Number(payment.amount).toLocaleString('en-US', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            })}
                                        </div>
                                        <div className="text-blue-100 text-sm">
                                            {payment.currency || 'KES'}
                                        </div>
                                    </div>

                                    {/* Type Card */}
                                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-600">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                                <FontAwesomeIcon icon={getTypeIcon(payment.type)} className="text-blue-600 dark:text-blue-400 text-lg" />
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">Type</div>
                                                <div className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                                                    {payment.type?.replace('_', ' ')}
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(payment.type)}`}>
                                            {payment.type}
                                        </span>
                                    </div>

                                    {/* Date Card */}
                                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-600">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                                                <FontAwesomeIcon icon={faCalendar} className="text-green-600 dark:text-green-400 text-lg" />
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">Created</div>
                                                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    {new Date(payment.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(payment.created_at).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Information */}
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                                    <FontAwesomeIcon icon={faReceipt} className="text-green-500" />
                                    Payment Details
                                </h2>
                            </div>
                            <div className="p-6">
                                <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-2">
                                                <FontAwesomeIcon icon={faUser} className="text-blue-500" />
                                                Member
                                            </dt>
                                            <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {payment.member_name ??
                                                    (payment.member?.first_name ?
                                                        `${payment.member?.first_name} ${payment.member?.last_name}` :
                                                        (payment.member_id ?? '—'))}
                                            </dd>
                                        </div>

                                        <div>
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-2">
                                                <FontAwesomeIcon icon={faChurch} className="text-purple-500" />
                                                Church
                                            </dt>
                                            <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {payment.church?.name ?? (payment.church_id ?? '—')}
                                            </dd>
                                        </div>

                                        <div>
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-2">
                                                <FontAwesomeIcon icon={faCreditCard} className="text-orange-500" />
                                                Payment Method
                                            </dt>
                                            <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {payment.payment_method ?? '—'}
                                            </dd>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-2">
                                                <FontAwesomeIcon icon={faCalendar} className="text-green-500" />
                                                Event
                                            </dt>
                                            <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {payment.event?.title ?
                                                    <Link
                                                        href={`/admin/church/events/${payment.event.id}`}
                                                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                                                    >
                                                        {payment.event.title}
                                                    </Link> :
                                                    (payment.event_id ?? '—')}
                                            </dd>
                                        </div>

                                        <div>
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-2">
                                                <FontAwesomeIcon icon={faHashtag} className="text-indigo-500" />
                                                Reference
                                            </dt>
                                            <dd className="text-lg font-semibold text-gray-900 dark:text-white font-mono">
                                                {payment.reference ?? '—'}
                                            </dd>
                                        </div>

                                        <div>
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-2">
                                                <FontAwesomeIcon icon={faClock} className="text-gray-500" />
                                                Last Updated
                                            </dt>
                                            <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {payment.updated_at ? new Date(payment.updated_at).toLocaleString() : '—'}
                                            </dd>
                                        </div>
                                    </div>

                                    {/* Description - Full Width */}
                                    {payment.description && (
                                        <div className="md:col-span-2">
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-2">
                                                <FontAwesomeIcon icon={faFileText} className="text-teal-500" />
                                                Description
                                            </dt>
                                            <dd className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                                                {payment.description}
                                            </dd>
                                        </div>
                                    )}

                                    {/* Payment Image */}
                                    {imageUrl && (
                                        <div className="md:col-span-2">
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-2">
                                                <FontAwesomeIcon icon={faReceipt} className="text-red-500" />
                                                Payment Receipt/Image
                                            </dt>
                                            <dd className="flex justify-center">
                                                <img
                                                    src={imageUrl}
                                                    alt="Payment receipt or documentation"
                                                    className="max-w-full h-auto max-h-96 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600"
                                                />
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                            </div>
                        </div>

                        {/* Reconciliations Section - Moved from sidebar */}
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                                        <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />
                                        Bank Reconciliations
                                    </h2>
                                    <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-medium px-2 py-1 rounded-full">
                                        {Array.isArray(payment.reconciliations) ? payment.reconciliations.length : 0}
                                    </span>
                                </div>
                            </div>
                            <div className="p-6">
                                {/* Show reconciliations if included on payment.reconciliations */}
                                {Array.isArray(payment.reconciliations) && payment.reconciliations.length > 0 ? (
                                    <div className="space-y-4">
                                        {payment.reconciliations.map((r: any) => (
                                            <div key={r.id} className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 bg-gray-50/50 dark:bg-gray-700/30 hover:bg-white dark:hover:bg-gray-700/50 transition-colors">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                                                        {r.statement_reference ?? `Rec-${r.id}`}
                                                    </div>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.status === 'reconciled' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                            r.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                                                r.status === 'disputed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                                                    'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                                                        }`}>
                                                        {r.status}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                    Date: {r.statement_date ?? new Date(r.created_at).toLocaleDateString()}
                                                </div>
                                                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    Amount: {r.statement_amount ? Number(r.statement_amount).toLocaleString() : '—'}
                                                </div>
                                                {r.notes && (
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                        {typeof r.notes === 'string' ? r.notes : r.notes?.text}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6">
                                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <FontAwesomeIcon icon={faReceipt} className="text-gray-400" />
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                            No reconciliation records found for this payment.
                                        </p>
                                    </div>
                                )}

                                {/* Toggle Reconciliation Form */}
                                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                                    {!showReconciliationForm ? (
                                        <button
                                            onClick={() => setShowReconciliationForm(true)}
                                            className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                        >
                                            <FontAwesomeIcon icon={faPlus} />
                                            Add Reconciliation
                                        </button>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-semibold text-gray-900 dark:text-white">New Reconciliation</h4>
                                                <button
                                                    onClick={() => setShowReconciliationForm(false)}
                                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                                >
                                                    <FontAwesomeIcon icon={faTimes} />
                                                </button>
                                            </div>
                                            <ReconciliationForm
                                                paymentId={payment.id}
                                                churchId={payment.church_id}
                                                onSaved={handleReconciliationCreated}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - 1 column */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                                    <FontAwesomeIcon icon={faDownload} className="text-purple-500" />
                                    Quick Actions
                                </h3>
                            </div>
                            <div className="p-4 space-y-2">
                                <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors duration-200">
                                    <FontAwesomeIcon icon={faDownload} className="text-gray-400" />
                                    <span>Export Receipt</span>
                                </button>
                                <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors duration-200">
                                    <FontAwesomeIcon icon={faShare} className="text-gray-400" />
                                    <span>Share Payment</span>
                                </button>
                                <Link
                                    href={`/admin/finance/payments/new`}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors duration-200"
                                >
                                    <FontAwesomeIcon icon={faPlus} />
                                    <span>Create Similar Payment</span>
                                </Link>
                                <Link
                                    href={`/admin/finance/payments/${payment.id}`}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-colors duration-200"
                                >
                                    <FontAwesomeIcon icon={faEye} />
                                    <span>View Full Details</span>
                                </Link>
                            </div>
                        </div>

                        {/* Payment Summary */}
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                                    <FontAwesomeIcon icon={faFileInvoice} className="text-indigo-500" />
                                    Summary
                                </h3>
                            </div>
                            <div className="p-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Church</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {payment.church?.name || '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Payment Type</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                        {payment.type?.replace('_', ' ') || '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(payment.status)}`}>
                                        {payment.status}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Created</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {new Date(payment.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                {payment.updated_at && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">Last Updated</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {new Date(payment.updated_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
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