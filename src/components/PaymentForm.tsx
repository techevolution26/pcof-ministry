'use client'
import React, { useEffect, useState } from 'react'
import Toast from './Toast'
import { createPayment } from '@/lib/adminApi'
import EventTypeahead from './EventTypeahead'
import ChurchMemberTypeahead from './ChurchMemberTypeahead'
import { useAdminAuth } from '@/hooks/useAdminAuth'

type Props = { initial?: any; onSaved?: (p: any) => void }

export default function PaymentForm({ initial = {}, onSaved }: Props) {
    const { user, isLoading } = useAdminAuth()
    const churchIdFromUser = user?.church_id

    const [form, setForm] = useState<any>({
        church_id: initial.church_id ?? churchIdFromUser ?? '',
        event_id: initial.event_id ?? null,
        member_id: initial.member_id ?? null,
        type: initial.type ?? 'collection',
        amount: initial.amount ?? '',
        currency: initial.currency ?? 'KES',
        reference: initial.reference ?? '',
        description: initial.description ?? '',
        payment_method: initial.payment_method ?? 'in-person',
    })
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<any>(null)

    useEffect(() => {
        // if user is church_admin, enforce church_id in the form
        if (!isLoading && user?.role === 'church_admin') {
            setForm(prev => ({ ...prev, church_id: user.church_id }))
        }
    }, [user, isLoading])

    function onChange(e: any) {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }

    async function handleEventSelect(ev: any) {
        // set event and infer church_id if event belongs to a church
        setForm(prev => ({
            ...prev,
            event_id: ev?.id ?? null,
            church_id: ev?.church_id ?? prev.church_id
        }))
    }

    async function handleMemberSelect(member: any) {
        setForm(prev => ({ ...prev, member_id: member?.id ?? null }))
    }

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            const payload = {
                ...form,
                amount: Number(form.amount),
            }
            const res = await createPayment(payload)
            const saved = res?.data ?? res
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
            {user?.role === 'superadmin' && (
                <div>
                    <label className="block text-xs text-gray-600">Church</label>
                    <input name="church_id" value={form.church_id} onChange={onChange} className="w-full p-2 border rounded" placeholder="church id or choose from list" />
                </div>
            )}

            <div>
                <label className="block text-xs text-gray-600">Event (optional)</label>
                <EventTypeahead churchId={form.church_id || undefined} onSelect={handleEventSelect} value={form.event_id} />
            </div>

            <div>
                <label className="block text-xs text-gray-600">Member (optional)</label>
                <ChurchMemberTypeahead churchId={form.church_id || undefined} onSelect={handleMemberSelect} value={form.member_id} />
            </div>

            <div>
                <label className="block text-xs text-gray-600">Type</label>
                <select name="type" value={form.type} onChange={onChange} className="w-full p-2 border rounded">
                    <option value="collection">Collection</option>
                    <option value="tithe">Tithe</option>
                    <option value="offering">Offering</option>
                    <option value="event_fee">Event fee</option>
                </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs text-gray-600">Amount</label>
                    <input type="number" name="amount" value={form.amount} onChange={onChange} className="w-full p-2 border rounded" required />
                </div>
                <div>
                    <label className="block text-xs text-gray-600">Currency</label>
                    <input name="currency" value={form.currency} onChange={onChange} className="w-full p-2 border rounded" />
                </div>
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
