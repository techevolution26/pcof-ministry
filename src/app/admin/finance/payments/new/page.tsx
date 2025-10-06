'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPayment } from '@/lib/adminApi'
import Toast from '@/components/Toast'

export default function NewPaymentPage() {
    const router = useRouter()
    const [payload, setPayload] = useState({ type: 'collection', amount: '', currency: 'KES', reference: '', church_id: '', member_id: '' })
    const [loading, setLoading] = useState(false)
    const [toast, setToast] = useState<{ show: boolean; message?: string; type?: 'success' | 'error' | 'info' }>({ show: false })

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        try {
            await createPayment({
                ...payload,
                amount: Number(payload.amount),
            })
            setToast({ show: true, message: 'Payment created', type: 'success' })
            // small delay to show toast then navigate
            setTimeout(() => router.push('/admin/finance/payments'), 600)
        } catch (err: any) {
            setToast({ show: true, message: err?.message ?? 'Failed to create payment', type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <form onSubmit={submit} className="bg-white p-6 rounded shadow space-y-4">
                <h2 className="text-lg font-semibold">New payment</h2>

                <div>
                    <label className="text-sm">Type</label>
                    <select value={payload.type} onChange={(e) => setPayload(p => ({ ...p, type: e.target.value }))} className="w-full p-2 border rounded">
                        <option value="collection">Collection</option>
                        <option value="tithe">Tithe</option>
                        <option value="offering">Offering</option>
                    </select>
                </div>

                <div>
                    <label className="text-sm">Amount</label>
                    <input value={payload.amount} onChange={(e) => setPayload(p => ({ ...p, amount: e.target.value }))} className="w-full p-2 border rounded" />
                </div>

                <div>
                    <label className="text-sm">Currency</label>
                    <input value={payload.currency} onChange={(e) => setPayload(p => ({ ...p, currency: e.target.value }))} className="w-full p-2 border rounded" />
                </div>

                <div>
                    <label className="text-sm">Reference</label>
                    <input value={payload.reference} onChange={(e) => setPayload(p => ({ ...p, reference: e.target.value }))} className="w-full p-2 border rounded" />
                </div>

                <div className="flex justify-end">
                    <button disabled={loading} className="px-4 py-2 bg-sky-600 text-white rounded">{loading ? 'Saving…' : 'Create'}</button>
                </div>
            </form>

            <Toast show={toast.show} message={toast.message} type={toast.type as any} onClose={() => setToast({ show: false })} />
        </>
    )
}
