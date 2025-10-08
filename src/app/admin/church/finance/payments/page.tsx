'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { fetchPayments, approvePayment, deleteMember /* replace deleteMember with deletePayment if exists */ } from '@/lib/adminApi'

export default function PaymentsList() {
    const { user, isLoading } = useAdminAuth()
    const [q, setQ] = useState('')
    const [page, setPage] = useState(1)
    const [items, setItems] = useState<any[]>([])
    const [meta, setMeta] = useState<any>({})
    const [loading, setLoading] = useState(true)
    const churchId = user?.church_id

    useEffect(() => {
        let mounted = true
        async function load() {
            setLoading(true)
            try {
                const body = await fetchPayments({ q: q || undefined, church_id: churchId, page, per_page: 25 })
                if (!mounted) return
                const list = Array.isArray(body) ? body : (body?.data ?? body?.results ?? [])
                const pagination = body?.meta ?? { current_page: body?.current_page ?? page, last_page: body?.last_page ?? 1, total: body?.total ?? list.length }
                setItems(list)
                setMeta(pagination)
            } catch (err) { console.error(err) }
            finally { if (mounted) setLoading(false) }
        }
        load()
        return () => { mounted = false }
    }, [q, page, churchId])

    async function handleApprove(id: string | number) {
        try {
            await approvePayment(id)
            // optimistic: update state
            setItems(prev => prev.map(i => i.id == id ? { ...i, status: 'approved' } : i))
        } catch (err: any) {
            alert(err?.message ?? 'Approve failed')
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-lg font-semibold">Payments</h1>
                <Link href="/admin/church/finance/payments/new" className="px-3 py-1 bg-sky-600 text-white rounded">Record payment</Link>
            </div>

            <div className="mb-3 flex gap-2">
                <input value={q} onChange={e => { setQ(e.target.value); setPage(1) }} placeholder="Search reference, member" className="p-2 border rounded w-72" />
            </div>

            <div className="bg-white rounded shadow overflow-auto">
                <table className="w-full text-left text-sm">
                    <thead className="text-xs text-gray-500">
                        <tr><th className="p-2">#</th><th className="p-2">Type</th><th className="p-2">Amount</th><th className="p-2">Status</th><th className="p-2">When</th><th className="p-2 text-right">Actions</th></tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={6} className="p-6">Loading…</td></tr> : items.map(it => (
                            <tr key={it.id} className="border-t">
                                <td className="p-2">{it.reference ?? it.id}</td>
                                <td className="p-2">{it.type}</td>
                                <td className="p-2">{it.amount} {it.currency ?? ''}</td>
                                <td className="p-2">{it.status}</td>
                                <td className="p-2">{new Date(it.created_at).toLocaleString()}</td>
                                <td className="p-2 text-right">
                                    <div className="inline-flex gap-2">
                                        <Link href={`/admin/church/finance/payments/${it.id}`} className="text-sky-600">View</Link>
                                        {user?.role === 'church_admin' && it.status === 'submitted' && (
                                            <button className="text-sm text-emerald-600" onClick={() => handleApprove(it.id)}>Approve</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!loading && items.length === 0 && <tr><td colSpan={6} className="p-4 text-gray-500">No payments</td></tr>}
                    </tbody>
                </table>
            </div>

            <div className="mt-3 flex items-center justify-between">
                <div className="text-sm text-gray-600">Showing {items.length} of {meta.total ?? items.length}</div>
                <div className="flex gap-2">
                    <button disabled={(meta.current_page ?? 1) <= 1} onClick={() => setPage(1)} className="px-3 py-1 border rounded">First</button>
                    <button disabled={(meta.current_page ?? 1) <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 border rounded">Prev</button>
                    <div className="px-3 py-1 border rounded">{meta.current_page ?? 1} / {meta.last_page ?? 1}</div>
                    <button disabled={(meta.current_page ?? 1) >= (meta.last_page ?? 1)} onClick={() => setPage(p => Math.min(meta.last_page ?? 1, p + 1))} className="px-3 py-1 border rounded">Next</button>
                </div>
            </div>
        </div>
    )
}
