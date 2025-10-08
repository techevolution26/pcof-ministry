'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { fetchReconciliations, deleteReconciliation } from '@/lib/adminApi'

export default function ReconciliationsListPage() {
    const { user, isLoading } = useAdminAuth()
    const churchId = user?.church_id
    const [items, setItems] = useState<any[]>([])
    const [meta, setMeta] = useState<any>({})
    const [loading, setLoading] = useState(true)
    const [q, setQ] = useState('')
    const [page, setPage] = useState(1)
    const [status, setStatus] = useState<string | undefined>(undefined)

    useEffect(() => {
        let mounted = true
        async function load() {
            setLoading(true)
            try {
                const res = await fetchReconciliations({ church_id: churchId, q: q || undefined, page, per_page: 25, status })
                const list = Array.isArray(res) ? res : (res?.data ?? [])
                const pagination = res?.meta ?? { current_page: res?.current_page ?? page, last_page: res?.last_page ?? 1, total: res?.total ?? list.length }
                if (!mounted) return
                setItems(list)
                setMeta(pagination)
            } catch (err) {
                console.error(err)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        if (!isLoading) load()
        return () => { mounted = false }
    }, [churchId, q, page, status, isLoading])

    async function handleDelete(id: number | string) {
        if (!confirm('Delete reconciliation?')) return
        try {
            await deleteReconciliation(id)
            setItems(prev => prev.filter(i => i.id !== id))
            setMeta(prev => ({ ...prev, total: Math.max(0, (prev.total ?? 1) - 1) }))
        } catch (err) {
            alert('Delete failed')
        }
    }

    if (isLoading) return <div className="p-6">Verifying…</div>

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-lg font-semibold">Reconciliations</h1>
                    <div className="text-sm text-gray-500">{meta.total ?? items.length} records</div>
                </div>

                <div className="flex gap-2">
                    <Link href="/admin/church/finance/reconciliations/new" className="px-3 py-1 bg-sky-600 text-white rounded">New reconciliation</Link>
                </div>
            </div>

            <div className="mb-3 flex gap-2">
                <input value={q} onChange={e => { setQ(e.target.value); setPage(1) }} placeholder="Search reference / notes" className="p-2 border rounded w-72" />
                <select value={status ?? ''} onChange={e => { setStatus(e.target.value || undefined); setPage(1) }} className="p-2 border rounded">
                    <option value="">All</option>
                    <option value="pending">Pending</option>
                    <option value="reconciled">Reconciled</option>
                    <option value="unmatched">Unmatched</option>
                </select>
            </div>

            <div className="bg-white rounded shadow overflow-auto">
                <table className="w-full text-left text-sm">
                    <thead className="text-xs text-gray-500">
                        <tr><th className="p-2">#</th><th className="p-2">Payment</th><th className="p-2">Ref</th><th className="p-2">Amount</th><th className="p-2">Date</th><th className="p-2">Status</th><th className="p-2 text-right">Actions</th></tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={7} className="p-6 text-center">Loading…</td></tr> : items.map(it => (
                            <tr key={it.id} className="border-t">
                                <td className="p-2">{it.id}</td>
                                <td className="p-2">{it.payment ? (it.payment.reference ?? `#${it.payment.id}`) : '—'}</td>
                                <td className="p-2">{it.statement_reference ?? '—'}</td>
                                <td className="p-2">{it.statement_amount ?? '—'}</td>
                                <td className="p-2">{it.statement_date ?? '—'}</td>
                                <td className="p-2">{it.status}</td>
                                <td className="p-2 text-right">
                                    <div className="inline-flex gap-2">
                                        <Link href={`/admin/church/finance/reconciliations/${it.id}`} className="text-sky-600">View</Link>
                                        {/* <Link href={`/admin/church/finance/reconciliations/${it.id}/edit`} className="text-gray-700">Edit</Link> */}
                                        <button onClick={() => handleDelete(it.id)} className="text-red-600">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!loading && items.length === 0 && <tr><td colSpan={7} className="p-4 text-gray-500">No reconciliations</td></tr>}
                    </tbody>
                </table>
            </div>

            <div className="mt-3 flex items-center justify-between">
                <div className="text-sm text-gray-600">{items.length} of {meta.total ?? items.length}</div>
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
