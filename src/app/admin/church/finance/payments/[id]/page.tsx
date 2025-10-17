'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Toast from '@/components/Toast'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { fetchPaymentById, approvePayment, deletePayment, createReconciliation } from '@/lib/adminApi'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faCheck,
  faEdit,
  faTrash,
  faSpinner,
  faFileInvoice,
  faCalendar,
  faUser,
  faChurch,
  faDollarSign
} from '@fortawesome/free-solid-svg-icons'

export default function PaymentShowPage() {
    const params = useParams()
    const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id
    const id = rawId ?? null
    const router = useRouter()
    const { user, isLoading } = useAdminAuth()

    const [payment, setPayment] = useState<unknown | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<unknown>(null)
    const [error, setError] = useState<string | null>(null)
    const [reconNotes, setReconNotes] = useState('')
    const [reconRef, setReconRef] = useState('')
    const [reconDate, setReconDate] = useState('')

    useEffect(() => {
        let mounted = true
        async function load() {
            setLoading(true); setError(null)
            try {
                if (!id) return
                const body = await fetchPaymentById(id)
                const data = body?.data ?? body
                if (!mounted) return
                setPayment(data)
            } catch (err: unknown) {
                console.error('Failed to load payment', err)
                if (!mounted) return
                setError(err?.message ?? 'Failed to load payment')
            } finally {
                if (mounted) setLoading(false)
            }
        }
        if (!isLoading) load()
        return () => { mounted = false }
    }, [id, isLoading])

    if (isLoading || loading) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50 dark:border-gray-700/50">
                    <FontAwesomeIcon icon={faSpinner} className="mx-auto mb-4 text-2xl text-blue-600 animate-spin" />
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Loading payment details…</div>
                </div>
            </div>
        </div>
    )

    if (error) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-red-200/50 dark:border-red-700/50">
                    <div className="text-red-600 dark:text-red-400 text-center">{error}</div>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 mx-auto mt-4 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    )

    if (!payment) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50 dark:border-gray-700/50">
                    <div className="text-gray-600 dark:text-gray-400 text-center">Payment not found.</div>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 mx-auto mt-4 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    )

    async function handleApprove() {
        if (!window.confirm('Approve this payment?')) return
        setSaving(true)
        try {
            const res = await approvePayment(payment.id)
            const resData = res?.data ?? res
            setPayment(resData)
            setToast({ show: true, message: 'Payment approved successfully', type: 'success' })
        } catch (err: unknown) {
            console.error(err)
            setToast({ show: true, message: err?.message ?? 'Failed to approve payment', type: 'error' })
        } finally { setSaving(false) }
    }

    async function handleDelete() {
        if (!window.confirm('Delete this payment? This action cannot be undone.')) return
        setSaving(true)
        try {
            await deletePayment(payment.id)
            setToast({ show: true, message: 'Payment deleted successfully', type: 'success' })
            setTimeout(() => router.push('/admin/church/finance'), 1500)
        } catch (err: unknown) {
            console.error(err)
            setToast({ show: true, message: err?.message ?? 'Failed to delete payment', type: 'error' })
        } finally { setSaving(false) }
    }

    async function handleCreateReconciliation(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            const payload = {
                payment_id: payment.id,
                statement_reference: reconRef || null,
                statement_date: reconDate || null,
                statement_amount: payment.amount,
                notes: reconNotes ? [reconNotes] : null,
                status: 'reconciled',
                church_id: payment.church_id ?? user?.church_id,
            }
            const res = await createReconciliation(payload)
            const saved = res?.data ?? res
            setPayment((p: unknown) => ({ ...p, reconciliations: [...(p.reconciliations ?? []), saved] }))
            setReconNotes(''); setReconRef(''); setReconDate('')
            setToast({ show: true, message: 'Reconciliation created successfully', type: 'success' })
        } catch (err: unknown) {
            console.error(err)
            setToast({ show: true, message: err?.message ?? 'Failed to create reconciliation', type: 'error' })
        } finally { setSaving(false) }
    }

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
                            Payment #{payment.id}
                        </h1>
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <span className="capitalize px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium">
                                {payment.type}
                            </span>
                            <span className={`capitalize px-3 py-1 rounded-full text-xs font-medium ${
                                payment.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                                payment.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300' :
                                'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'
                            }`}>
                                {payment.status}
                            </span>
                            <span>
                                Created: {payment.created_at ? new Date(payment.created_at).toLocaleDateString() : 'Unknown'}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {payment.status !== 'approved' && (user?.role === 'superadmin' || user?.role === 'church_admin') && (
                            <button 
                                onClick={handleApprove} 
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-lg"
                            >
                                <FontAwesomeIcon icon={faCheck} />
                                <span className="text-sm font-medium">Approve</span>
                            </button>
                        )}
                        <Link 
                            href={`/admin/church/finance/payments/${payment.id}/edit`}
                            className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                            <FontAwesomeIcon icon={faEdit} className="text-gray-600 dark:text-gray-400" />
                            <span className="text-sm font-medium">Edit</span>
                        </Link>
                        <button 
                            onClick={handleDelete} 
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-red-200/50 dark:border-red-700/50 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 shadow-sm hover:shadow-md text-red-600 dark:text-red-400"
                        >
                            <FontAwesomeIcon icon={faTrash} />
                            <span className="text-sm font-medium">Delete</span>
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Payment Details */}
                    <div className="lg:col-span-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <FontAwesomeIcon icon={faFileInvoice} className="text-blue-500" />
                            Payment Details
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        Amount
                                    </label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <FontAwesomeIcon icon={faDollarSign} className="text-green-500" />
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {payment.amount} {payment.currency}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        Reference
                                    </label>
                                    <div className="text-lg font-medium text-gray-900 dark:text-white mt-1">
                                        {payment.reference ?? '—'}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        Created Date
                                    </label>
                                    <div className="flex items-center gap-2 text-gray-900 dark:text-white mt-1">
                                        <FontAwesomeIcon icon={faCalendar} className="text-gray-400" />
                                        {payment.created_at ? new Date(payment.created_at).toLocaleString() : '—'}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        Member
                                    </label>
                                    <div className="flex items-center gap-2 text-gray-900 dark:text-white mt-1">
                                        <FontAwesomeIcon icon={faUser} className="text-blue-500" />
                                        {payment.member ? `${payment.member.first_name} ${payment.member.last_name}` : (payment.member_id ? `Member #${payment.member_id}` : '—')}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        Event
                                    </label>
                                    <div className="flex items-center gap-2 text-gray-900 dark:text-white mt-1">
                                        <FontAwesomeIcon icon={faChurch} className="text-purple-500" />
                                        {payment.event ? payment.event.title : (payment.event_id ? `Event #${payment.event_id}` : '—')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mt-6">
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                Description & Notes
                            </label>
                            <div className="mt-2 p-4 bg-white/50 dark:bg-gray-700/50 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
                                <div className="text-gray-900 dark:text-white whitespace-pre-wrap">
                                    {payment.description ?? 'No description provided'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reconciliations Sidebar */}
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <FontAwesomeIcon icon={faFileInvoice} className="text-green-500" />
                            Reconciliations
                        </h3>
                        
                        <div className="space-y-3 mb-6">
                            {(payment.reconciliations ?? []).length === 0 ? (
                                <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                    No reconciliations yet
                                </div>
                            ) : (
                                (payment.reconciliations ?? []).map((r: unknown) => (
                                    <div key={r.id} className="p-3 bg-white/50 dark:bg-gray-700/50 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {r.statement_reference ?? `#${r.id}`}
                                            </div>
                                            <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full capitalize">
                                                {r.status}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                            {r.statement_date ? new Date(r.statement_date).toLocaleDateString() : 'No date'}
                                        </div>
                                        <div className="text-sm text-gray-700 dark:text-gray-300">
                                            {Array.isArray(r.notes) ? r.notes.join('; ') : (r.notes ?? 'No notes')}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* New Reconciliation Form */}
                        <form onSubmit={handleCreateReconciliation} className="space-y-4">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Add Reconciliation</h4>
                            
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Statement Reference
                                </label>
                                <input 
                                    className="w-full px-3 py-2 bg-white/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    value={reconRef}
                                    onChange={e => setReconRef(e.target.value)}
                                    placeholder="Bank reference number..."
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Statement Date
                                </label>
                                <input 
                                    type="date"
                                    className="w-full px-3 py-2 bg-white/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    value={reconDate}
                                    onChange={e => setReconDate(e.target.value)}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Notes
                                </label>
                                <input 
                                    className="w-full px-3 py-2 bg-white/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    value={reconNotes}
                                    onChange={e => setReconNotes(e.target.value)}
                                    placeholder="Additional notes..."
                                />
                            </div>
                            
                            <button 
                                type="submit"
                                disabled={saving}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-lg"
                            >
                                <FontAwesomeIcon icon={faCheck} />
                                <span className="text-sm font-medium">Create Reconciliation</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Toast Notification */}
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