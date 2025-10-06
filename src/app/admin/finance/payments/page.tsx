'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchPayments } from '@/lib/adminApi'

export default function PaymentsPage() {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [lastPage, setLastPage] = useState(1)

  useEffect(() => {
    let mounted = true
    ; (async () => {
      setLoading(true)
      try {
        const body = await fetchPayments({ q: q || undefined, page, per_page: 30 })
        if (!mounted) return
        const list = Array.isArray(body) ? body : (body?.data ?? [])
        setItems(list)
        const meta = body?.meta ?? body?.pagination ?? null
        setTotal(meta?.total ?? (Array.isArray(list) ? list.length : 0))
        setLastPage(meta?.last_page ?? meta?.lastPage ?? 1)
      } catch (err) {
        console.error(err)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [q, page])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">Payments</h1>
          <div className="text-sm text-gray-500">Recent collections and donations</div>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/finance/payments/new" className="px-3 py-2 bg-sky-600 text-white rounded">New payment</Link>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Search by reference or type" className="p-2 border rounded w-full sm:w-96" />
      </div>

      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-gray-500 bg-gray-50">
            <tr>
              <th className="p-3">Type</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Currency</th>
              <th className="p-3">Status</th>
              <th className="p-3">Reference</th>
              <th className="p-3">When</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-6">Loading…</td></tr>
            ) : (
              items.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3">{p.type}</td>
                  <td className="p-3">{Number(p.amount).toLocaleString()}</td>
                  <td className="p-3">{p.currency ?? 'NGN'}</td>
                  <td className="p-3">{p.status ?? 'completed'}</td>
                  <td className="p-3">{p.reference ?? '—'}</td>
                  <td className="p-3">{new Date(p.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
            {!loading && items.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-gray-500">No payments</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">Showing {items.length} of {total}</div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage(1)} disabled={page <= 1} className="px-3 py-1 border rounded">First</button>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 border rounded">Prev</button>
          <div className="px-3 py-1 border rounded">{page} / {lastPage}</div>
          <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={page >= lastPage} className="px-3 py-1 border rounded">Next</button>
          <button onClick={() => setPage(lastPage)} disabled={page >= lastPage} className="px-3 py-1 border rounded">Last</button>
        </div>
      </div>
    </div>
  )
}
