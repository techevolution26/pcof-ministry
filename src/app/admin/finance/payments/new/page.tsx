// app/admin/finance/payments/new/page.tsx
'use client'
import React, { useEffect, useState } from 'react'
import { fetchChurchesList, createPayment, fetchMembersForChurch } from '@/lib/adminApi'
import MemberTypeahead from '@/components/MemberTypeahead'
import Link from 'next/link'
import Toast from '@/components/Toast'

export default function SuperAdminNewPaymentPage() {
    const [churches, setChurches] = useState<any[]>([])
    const [churchId, setChurchId] = useState<string | number | ''>('')
    const [member, setMember] = useState<any | null>(null)
    const [type, setType] = useState('collection')
    const [amount, setAmount] = useState<string | number>('')
    const [currency, setCurrency] = useState('KES')
    const [reference, setReference] = useState('')
    const [description, setDescription] = useState('')
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<any | null>(null)
    const [membersList, setMembersList] = useState<any[]>([])

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const list = await fetchChurchesList()
                if (!mounted) return
                setChurches(list)
            } catch (err) {
                console.error('Failed to load churches', err)
            }
        })()
        return () => { mounted = false }
    }, [])

    useEffect(() => {
        let mounted = true;
        // prefetch a small list of members for the chosen church (optional)
        (async () => {
            if (!churchId) { setMembersList([]); return }
            try {
                const res = await fetchMembersForChurch(churchId as any, { per_page: 50 })
                if (!mounted) return
                // res may be paginated: normalize to array
                const arr = Array.isArray(res) ? res : (res?.data ?? [])
                setMembersList(arr)
            } catch (err) {
                console.warn('Failed to prefetch members', err)
                setMembersList([])
            }
        })()
        return () => { mounted = false }
    }, [churchId])

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            const payload = {
                church_id: churchId || null,
                member_id: member?.id ?? null,
                type,
                amount: Number(amount),
                currency,
                reference,
                description,
            }
            const res = await createPayment(payload)
            const saved = res?.data ?? res
            setToast({ show: true, type: 'success', message: 'Payment created' })
            // optional: redirect to payment details
            // router.push(`/admin/finance/payments/${saved.id}`)
        } catch (err: any) {
            console.error(err)
            setToast({ show: true, type: 'error', message: err?.message ?? 'Failed to create' })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-semibold">Record Payment (Superadmin)</h1>
                    <div className="text-sm text-gray-500">Optionally select a church to scope members</div>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/finance" className="px-3 py-2 border rounded">Back</Link>
                </div>
            </div>

            <form onSubmit={submit} className="bg-white rounded shadow p-4 space-y-3 max-w-2xl">
                <div>
                    <label className="text-xs text-gray-600 block mb-1">Church (optional)</label>
                    <select value={String(churchId)} onChange={(e) => setChurchId(e.target.value || '')} className="w-full p-2 border rounded">
                        <option value="">— Select church —</option>
                        {churches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                <div>
                    <label className="text-xs text-gray-600 block mb-1">Member (optional)</label>
                    <MemberTypeahead churchId={churchId || undefined} value={member?.id ?? null} onSelect={(m) => setMember(m)} />
                </div>

                <div>
                    <label className="block text-xs text-gray-600">Type</label>
                    <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-2 border rounded">
                        <option value="collection">Collection</option>
                        <option value="tithe">Tithe</option>
                        <option value="offering">Offering</option>
                        <option value="event_fee">Event Fee</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs text-gray-600">Amount</label>
                        <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required className="w-full p-2 border rounded" />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-600">Currency</label>
                        <input value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full p-2 border rounded" />
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-gray-600">Reference</label>
                    <input value={reference} onChange={(e) => setReference(e.target.value)} className="w-full p-2 border rounded" />
                </div>

                <div>
                    <label className="block text-xs text-gray-600">Description</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded" />
                </div>

                <div className="flex justify-end gap-2">
                    <button type="submit" disabled={saving} className="px-4 py-2 bg-sky-600 text-white rounded">{saving ? 'Saving…' : 'Save payment'}</button>
                </div>
            </form>

            {toast && <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    )
}
