'use client'
import React, { useState } from 'react'
import PaymentTypeahead from './PaymentTypeahead'
import { createReconciliation, updateReconciliation } from '@/lib/adminApi'
import Toast from './Toast'

type Props = {
    initial?: any
    churchId?: string | number
    onSaved?: (rec: any) => void
}

export default function ReconciliationForm({ initial = {}, churchId, onSaved }: Props) {
    const [form, setForm] = useState<any>({
        payment_id: initial.payment_id ?? null,
        statement_reference: initial.statement_reference ?? '',
        statement_date: initial.statement_date ?? '',
        statement_amount: initial.statement_amount ?? '',
        notes: initial.notes ?? null,
        status: initial.status ?? 'pending',
        church_id: initial.church_id ?? churchId ?? '',
    })
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<any>(null)
    const [selectedPayment, setSelectedPayment] = useState<any>(initial.payment ?? null)

    function onChange(e: any) {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }

    async function handleSelectPayment(p: any) {
        setSelectedPayment(p)
        setForm(prev => ({ ...prev, payment_id: p?.id, statement_amount: prev.statement_amount || p?.amount }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            const payload = {
                payment_id: form.payment_id,
                church_id: form.church_id,
                statement_reference: form.statement_reference || null,
                statement_date: form.statement_date || null,
                statement_amount: form.statement_amount ? Number(form.statement_amount) : null,
                notes: form.notes ? (typeof form.notes === 'string' ? { text: form.notes } : form.notes) : null,
                status: form.status,
            }

            let res
            if (initial?.id) {
                res = await updateReconciliation(initial.id, payload)
            } else {
                res = await createReconciliation(payload)
            }
            onSaved?.(res?.data ?? res)
            setToast({ show: true, message: 'Saved', type: 'success' })
        } catch (err: any) {
            console.error(err)
            setToast({ show: true, message: err?.message ?? 'Save failed', type: 'error' })
        } finally {
            setSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded shadow p-4 space-y-3">
            <div>
                <label className="text-xs text-gray-600 block">Payment (optional)</label>
                <PaymentTypeahead churchId={churchId} onSelect={handleSelectPayment} value={selectedPayment} />
            </div>

            <div>
                <label className="text-xs text-gray-600 block">Statement reference</label>
                <input name="statement_reference" value={form.statement_reference} onChange={onChange} className="w-full p-2 border rounded" />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs text-gray-600 block">Statement date</label>
                    <input name="statement_date" type="date" value={form.statement_date ?? ''} onChange={onChange} className="w-full p-2 border rounded" />
                </div>
                <div>
                    <label className="text-xs text-gray-600 block">Amount</label>
                    <input name="statement_amount" type="number" step="0.01" value={form.statement_amount ?? ''} onChange={onChange} className="w-full p-2 border rounded" />
                </div>
            </div>

            <div>
                <label className="text-xs text-gray-600 block">Notes</label>
                <textarea name="notes" value={typeof form.notes === 'string' ? form.notes : (form.notes?.text ?? '')} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} className="w-full p-2 border rounded" />
            </div>

            <div>
                <label className="text-xs text-gray-600 block">Status</label>
                <select name="status" value={form.status} onChange={onChange} className="w-full p-2 border rounded">
                    <option value="pending">Pending</option>
                    <option value="reconciled">Reconciled</option>
                    <option value="unmatched">Unmatched</option>
                </select>
            </div>

            <div className="flex justify-end gap-2">
                <button className="px-4 py-2 border rounded" type="button" onClick={() => { if (onSaved) onSaved(null) }}>Cancel</button>
                <button className="px-4 py-2 bg-sky-600 text-white rounded" disabled={saving}>{saving ? 'Saving…' : (initial?.id ? 'Save' : 'Create')}</button>
            </div>

            {toast && <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </form>
    )
}
