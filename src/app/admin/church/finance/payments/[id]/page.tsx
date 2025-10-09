// app/admin/church/finance/payments/[id]/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Toast from '@/components/Toast'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { fetchPaymentById, approvePayment, deletePayment, createReconciliation } from '@/lib/adminApi'

export default function PaymentShowPage() {
    const params = useParams()
    const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id
    const id = rawId ?? null
    const router = useRouter()
    const { user, isLoading } = useAdminAuth()

    const [payment, setPayment] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<any>(null)
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
            } catch (err: any) {
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

    if (isLoading || loading) return <div className="p-6 text-gray-500">Loading payment…</div>
    if (error) return <div className="p-6 text-red-600">{error}</div>
    if (!payment) return <div className="p-6 text-gray-500">Payment not found.</div>

    async function handleApprove() {
        if (!window.confirm('Approve this payment?')) return
        setSaving(true)
        try {
            const res = await approvePayment(payment.id)
            const resData = res?.data ?? res
            setPayment(resData)
            setToast({ show: true, message: 'Payment approved', type: 'success' })
        } catch (err: any) {
            console.error(err)
            setToast({ show: true, message: err?.message ?? 'Approve failed', type: 'error' })
        } finally { setSaving(false) }
    }

    async function handleDelete() {
        if (!window.confirm('Delete this payment? This cannot be undone.')) return
        setSaving(true)
        try {
            await deletePayment(payment.id)
            setToast({ show: true, message: 'Payment deleted', type: 'success' })
            router.push('/admin/church/finance') // back to list
        } catch (err: any) {
            console.error(err)
            setToast({ show: true, message: err?.message ?? 'Delete failed', type: 'error' })
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
            // attach to payment local object for UI
            setPayment((p: any) => ({ ...p, reconciliations: [...(p.reconciliations ?? []), saved] }))
            setReconNotes(''); setReconRef(''); setReconDate('')
            setToast({ show: true, message: 'Reconciliation created', type: 'success' })
        } catch (err: any) {
            console.error(err)
            setToast({ show: true, message: err?.message ?? 'Failed to create reconciliation', type: 'error' })
        } finally { setSaving(false) }
    }

    return (
        <div>
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-semibold">Payment #{payment.id}</h1>
                    <div className="text-sm text-gray-500">{payment.type} • {payment.status}</div>
                    <div className="text-xs text-gray-400">Created: {payment.created_at ? new Date(payment.created_at).toLocaleString() : ''}</div>
                </div>

                <div className="flex gap-2">
                    {payment.status !== 'approved' && (user?.role === 'superadmin' || user?.role === 'church_admin') && (
                        <button onClick={handleApprove} disabled={saving} className="px-3 py-1 bg-emerald-600 text-white rounded">Approve</button>
                    )}
                    <Link href={`/admin/church/finance/payments/${payment.id}/edit`} className="px-3 py-1 border rounded">Edit</Link>
                    <button onClick={handleDelete} disabled={saving} className="px-3 py-1 border rounded text-red-600">Delete</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="col-span-2 bg-white rounded shadow p-4">
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <dt className="text-xs text-gray-500">Amount</dt>
                            <dd className="text-lg font-semibold">{payment.amount} {payment.currency}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500">Reference</dt>
                            <dd>{payment.reference ?? '—'}</dd>
                        </div>

                        <div>
                            <dt className="text-xs text-gray-500">Member</dt>
                            <dd>{payment.member ? `${payment.member.first_name} ${payment.member.last_name}` : (payment.member_id ? `#${payment.member_id}` : '—')}</dd>
                        </div>

                        <div>
                            <dt className="text-xs text-gray-500">Event</dt>
                            <dd>{payment.event ? payment.event.title : (payment.event_id ? `#${payment.event_id}` : '—')}</dd>
                        </div>

                        <div className="md:col-span-2">
                            <dt className="text-xs text-gray-500">Description / notes</dt>
                            <dd className="whitespace-pre-wrap">{payment.description ?? '—'}</dd>
                        </div>
                    </dl>
                </div>

                <aside className="bg-white rounded shadow p-4">
                    <h3 className="text-sm font-semibold mb-2">Reconciliations</h3>
                    <div className="space-y-2">
                        {(payment.reconciliations ?? []).map((r: any) => (
                            <div key={r.id} className="border p-2 rounded">
                                <div className="text-sm font-medium">{r.statement_reference ?? `#${r.id}`}</div>
                                <div className="text-xs text-gray-500">{r.statement_date ?? ''} • {r.status}</div>
                                <div className="text-xs">{Array.isArray(r.notes) ? r.notes.join('; ') : (r.notes ?? '')}</div>
                            </div>
                        ))}
                        {(payment.reconciliations ?? []).length === 0 && <div className="text-sm text-gray-500">No reconciliations</div>}
                    </div>

                    <form onSubmit={handleCreateReconciliation} className="mt-4 space-y-2">
                        <div>
                            <label className="block text-xs text-gray-600">Statement ref.</label>
                            <input className="w-full p-2 border rounded text-sm" value={reconRef} onChange={e => setReconRef(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600">Statement date</label>
                            <input type="date" className="w-full p-2 border rounded text-sm" value={reconDate} onChange={e => setReconDate(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600">Notes</label>
                            <input className="w-full p-2 border rounded text-sm" value={reconNotes} onChange={e => setReconNotes(e.target.value)} />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button className="px-3 py-1 bg-sky-600 text-white rounded" disabled={saving}>Create reconciliation</button>
                        </div>
                    </form>
                </aside>
            </div>

            {toast && <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    )
}
