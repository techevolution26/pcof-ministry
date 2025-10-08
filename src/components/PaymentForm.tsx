'use client'
import React, { useEffect, useState } from 'react'
import Toast from './Toast'
import { createPayment, fetchChurchesList, fetchAssemblies } from '@/lib/adminApi'

type Props = { initial?: any; onSaved?: (p: any) => void }

export default function PaymentForm({ initial = {}, onSaved }: Props) {
    const [form, setForm] = useState<any>({
        church_id: initial.church_id ?? '',
        type: initial.type ?? 'collection',
        amount: initial.amount ?? '',
        currency: initial.currency ?? 'KES',
        reference: initial.reference ?? '',
        member_id: initial.member_id ?? '',
        description: initial.description ?? '',
        payment_method: initial.payment_method ?? 'in-person',
    })
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<any>(null)

    function onChange(e: any) {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            const payload = { ...form, amount: Number(form.amount) }
            const res = await createPayment(payload)
            const saved = res?.data ?? res
            // optimistic handoff: store created so members page can pick up
            try { localStorage.setItem('pcf_recent_created_member', JSON.stringify(saved)) } catch { }
            setToast({ show: true, message: 'Payment saved', type: 'success' })
            onSaved?.(saved)
        } catch (err: any) {
            console.error(err)
            setToast({ show: true, message: err?.message ?? 'Failed', type: 'error' })
        } finally {
            setSaving(false)
        }
    }

    return (
        <form onSubmit={submit} className="bg-white rounded shadow p-4 space-y-3">
            <div>
                <label className="block text-xs text-gray-600">Type</label>
                <select name="type" value={form.type} onChange={onChange} className="w-full p-2 border rounded">
                    <option value="collection">Collection</option>
                    <option value="tithe">Tithe</option>
                    <option value="offering">Offering</option>
                </select>
            </div>

            <div>
                <label className="block text-xs text-gray-600">Amount</label>
                <input type="number" name="amount" value={form.amount} onChange={onChange} className="w-full p-2 border rounded" required />
            </div>

            <div>
                <label className="block text-xs text-gray-600">Currency</label>
                <input name="currency" value={form.currency} onChange={onChange} className="w-full p-2 border rounded" />
            </div>

            <div>
                <label className="block text-xs text-gray-600">Reference</label>
                <input name="reference" value={form.reference} onChange={onChange} className="w-full p-2 border rounded" />
            </div>

            <div>
                <label className="block text-xs text-gray-600">Description</label>
                <textarea name="description" value={form.description} onChange={onChange} className="w-full p-2 border rounded" />
            </div>

            <div className="flex justify-end gap-2">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-sky-600 text-white rounded">{saving ? 'Saving…' : 'Save'}</button>
            </div>

            {toast && <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </form>
    )
}
