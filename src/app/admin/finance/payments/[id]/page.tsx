// app/admin/finance/payments/[id]/page.tsx
'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Toast from '@/components/Toast'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { fetchPaymentById, approvePayment, createReconciliation } from '@/lib/adminApi'
import ReconciliationForm from '@/components/ReconciliationForm'

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
                setError(err?.message ?? 'Failed to load payment')
            } finally {
                if (mounted) setLoading(false)
            }
        }
        if (!isLoading) load()
        return () => { mounted = false }
    }, [id, isLoading])

    async function handleApprove() {
        if (!payment) return
        if (!window.confirm('Approve this payment?')) return
        setApproving(true)
        try {
            const body = await approvePayment(payment.id)
            const p = body?.data ?? body
            setPayment(p)
            setToast({ show: true, message: 'Payment approved', type: 'success' })
        } catch (err: any) {
            console.error(err)
            setToast({ show: true, message: err?.message ?? 'Approve failed', type: 'error' })
        } finally {
            setApproving(false)
        }
    }

    async function handleReconciliationCreated(rec: any) {
        // After creating reconciliation, attempt to refresh payment (to pick reconciliations)
        try {
            const body = await fetchPaymentById(id)
            const p = body?.data ?? body
            setPayment(p)
            setToast({ show: true, message: 'Reconciliation saved', type: 'success' })
        } catch {
            // ignore
        }
    }

    if (isLoading || loading) return <div className="p-6 text-gray-500">Loading…</div>
    if (error) return <div className="p-6 text-red-600">{error}</div>
    if (!payment) return <div className="p-6 text-gray-500">Payment not found</div>

    // helper to get event image or payment file
    const imageUrl = payment?.image_url ?? payment?.file_url ?? payment?.metadata?.image_url

    return (
        <div>
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-semibold">Payment — {payment.reference ?? `#${payment.id}`}</h1>
                    <div className="text-sm text-gray-500">{payment.type} • {payment.status}</div>
                </div>

                <div className="flex gap-2">
                    {payment.status === 'submitted' && (
                        <button onClick={handleApprove} disabled={approving} className="px-3 py-1 bg-green-600 text-white rounded">
                            {approving ? 'Approving…' : 'Approve'}
                        </button>
                    )}
                    <Link href="/admin/finance/payments" className="px-3 py-1 border rounded">Back</Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                <div className="col-span-2 bg-white rounded shadow p-4">
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <dt className="text-xs text-gray-500">Amount</dt>
                            <dd className="font-medium">{payment.amount} {payment.currency ?? ''}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500">Member</dt>
                            <dd>{payment.member_name ?? payment.member?.first_name ? `${payment.member?.first_name} ${payment.member?.last_name}` : (payment.member_id ?? '—')}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500">Church</dt>
                            <dd>{payment.church?.name ?? (payment.church_id ?? '—')}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500">Method</dt>
                            <dd>{payment.payment_method ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500">Event</dt>
                            <dd>{payment.event?.title ? <Link href={`/admin/church/events/${payment.event.id}`}>{payment.event.title}</Link> : (payment.event_id ?? '—')}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500">Created</dt>
                            <dd>{payment.created_at ? new Date(payment.created_at).toLocaleString() : '—'}</dd>
                        </div>

                        <div className="md:col-span-2">
                            <dt className="text-xs text-gray-500">Description</dt>
                            <dd className="whitespace-pre-wrap">{payment.description ?? '—'}</dd>
                        </div>
                    </dl>

                    {imageUrl && (
                        <div className="mt-4">
                            <img src={imageUrl} alt="payment file" className="max-w-xs rounded" />
                        </div>
                    )}
                </div>

                <aside className="bg-white rounded shadow p-4">
                    <h3 className="text-sm font-semibold mb-2">Reconciliations</h3>

                    {/* Show reconciliations if included on payment.reconciliations */}
                    {Array.isArray(payment.reconciliations) && payment.reconciliations.length > 0 ? (
                        <div className="space-y-2">
                            {payment.reconciliations.map((r: any) => (
                                <div key={r.id} className="border rounded p-2">
                                    <div className="text-sm font-medium">{r.statement_reference ?? r.id}</div>
                                    <div className="text-xs text-gray-500">{r.statement_date ?? r.created_at}</div>
                                    <div className="text-xs">{r.statement_amount ?? '—'}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-xs text-gray-500">No reconciliations</div>
                    )}

                    <div className="mt-4">
                        <ReconciliationForm paymentId={payment.id} defaultChurchId={payment.church_id} onSaved={handleReconciliationCreated} />
                    </div>
                </aside>
            </div>

            {toast && <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    )
}
