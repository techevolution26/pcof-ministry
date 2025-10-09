// app/admin/finance/page.tsx  (or components/AdminFinancePage.tsx)
'use client'
import React, { useCallback, useEffect, useState } from 'react'
import { apiGet } from '@/lib/adminApi'
import Link from 'next/link'
import { fetchChurchesList } from '@/lib/adminApi'

export default function AdminFinancePage() {
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // controls
  const [churchId, setChurchId] = useState<string | number | ''>('')
  const [recentCount, setRecentCount] = useState<number>(20) // default number of recents to show
  const [page, setPage] = useState<number>(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [lastPage, setLastPage] = useState<number | null>(null)

  const [churches, setChurches] = useState<any[]>([])

  const num = (v: any) => {
    if (v === null || v === undefined || v === '') return 0
    const n = typeof v === 'number' ? v : Number(String(v).replace(/,/g, '') || 0)
    return Number.isFinite(n) ? n : 0
  }
  const fmtNumber = (v: number) => {
    try { return new Intl.NumberFormat().format(v) } catch { return String(v) }
  }

  // Safe payment processing function to handle duplicate and missing IDs
  const getSafeRecentPayments = (payments: any[]): any[] => {
    const seenIds = new Set()
    const safePayments: any[] = []
    let duplicateCount = 0
    let missingIdCount = 0

    payments.forEach((p, index) => {
      if (!p.id) {
        missingIdCount++
        // Create a synthetic ID for items missing an ID
        const syntheticId = `missing-${index}-${Date.now()}`
        safePayments.push({ ...p, id: syntheticId })
      } else if (seenIds.has(String(p.id))) {
        duplicateCount++
        // Append index to duplicate IDs to make them unique
        const uniqueId = `${p.id}-dup-${index}`
        safePayments.push({ ...p, id: uniqueId })
      } else {
        seenIds.add(String(p.id))
        safePayments.push(p)
      }
    })

    // Log warnings for debugging
    if (duplicateCount > 0 || missingIdCount > 0) {
      console.warn(`Payment list issues: ${duplicateCount} duplicates, ${missingIdCount} missing IDs`)
    }

    return safePayments
  }

  const load = useCallback(async (opts?: { refresh?: boolean; page?: number }) => {
    const p = opts?.page ?? page
    if (opts?.refresh) setLoading(true)
    try {
      // pass church and recent_limit as query params (backend may accept recent_limit)
      const qs = new URLSearchParams()
      if (churchId) qs.set('church_id', String(churchId))
      if (recentCount) qs.set('recent_limit', String(recentCount))
      if (p && p > 1) qs.set('page', String(p))
      const path = `/api/admin/finance/summary${qs.toString() ? `?${qs.toString()}` : ''}`
      const body = await apiGet(path)

      // normalize
      const recent = Array.isArray(body?.recent_payments)
        ? body.recent_payments
        : Array.isArray(body?.payments)
          ? body.payments
          : (body?.data ?? [])

      const meta = body?.meta ?? body?.pagination ?? null
      setLastPage(meta?.last_page ?? meta?.lastPage ?? null)

      setSummary({
        raw: body,
        donations_total: num(body?.total_payments ?? 0),
        tithes_30d: num(body?.total_tithes ?? 0),
        collections_pending: num(body?.pending_collections?.total ?? body?.pending ?? 0),
        recent_payments: recent,
      })
      setError(null)
    } catch (err: any) {
      console.error('Failed to load finance summary', err)
      setError(err?.message ?? 'Failed to load finance summary')
      setSummary(null)
      setLastPage(null)
    } finally {
      setLoading(false)
    }
  }, [page, churchId, recentCount])

  useEffect(() => {
    let mounted = true
      ; (async () => {
        if (!mounted) return
        // fetch list of churches for superadmin dropdown (per_page=200)
        try {
          const c = await fetchChurchesList()
          if (mounted) setChurches(c)
        } catch (err) {
          console.warn('Failed to load churches', err)
        }
        await load({ refresh: true, page: 1 })
      })()
    return () => { mounted = false }
  }, [load])

  // client-side slice fallback: if backend sends more recents than we want
  const recentsRaw = (summary?.recent_payments ?? []) as any[]
  const safeRecentsRaw = getSafeRecentPayments(recentsRaw)
  const recents = safeRecentsRaw.slice(0, recentCount)

  async function handleLoadMore() {
    if (lastPage !== null && page >= lastPage) return
    setIsLoadingMore(true)
    try {
      const next = page + 1
      await load({ page: next })
      setPage(next)
    } catch (err: any) {
      console.error(err)
    } finally {
      setIsLoadingMore(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-gray-500">Loading…</div>
  }
  if (error) {
    return <div className="p-6 text-red-600">Error: {error}</div>
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Superadmin Finance</h1>
          <div className="text-sm text-gray-500">Overview — recent payments limited to {recentCount}</div>
        </div>

        <div className="flex items-center gap-2">
          <select value={churchId} onChange={(e) => { setChurchId(e.target.value); setPage(1) }} className="p-2 border rounded text-sm">
            <option value="">All churches</option>
            {churches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select value={String(recentCount)} onChange={(e) => { setRecentCount(Number(e.target.value) || 10); setPage(1) }} className="p-2 border rounded text-sm">
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>

          <button onClick={() => load({ refresh: true, page: 1 })} className="px-3 py-2 border rounded text-sm">Refresh</button>
          <Link href="/admin/finance/payments/new" className="px-3 py-2 bg-indigo-600 text-white rounded text-sm">New Payment</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Total donations (period)</div>
          <div className="text-2xl font-bold mt-2">{fmtNumber(num(summary?.donations_total ?? 0))}</div>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Tithes (period)</div>
          <div className="text-2xl font-bold mt-2">{fmtNumber(num(summary?.tithes_30d ?? 0))}</div>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Pending collections</div>
          <div className="text-2xl font-bold mt-2">{fmtNumber(num(summary?.collections_pending ?? 0))}</div>
        </div>
      </div>

      <div className="bg-white rounded shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent payments</h2>
          <div className="text-sm text-gray-500">{recents.length} shown</div>
        </div>

        {recents.length === 0 ? (
          <div className="text-sm text-gray-500">No recent payments</div>
        ) : (
          <ul className="divide-y">
            {recents.map((p: any) => (
              <li key={String(p.id)} className="py-3 flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="px-2 py-1 bg-slate-100 text-xs rounded font-medium text-slate-700">{p.type}</div>
                  <div>
                    <div className="font-medium">{p.type} — <span className="text-slate-500 text-sm">{p.reference ?? p.id}</span></div>
                    <div className="text-xs text-gray-500">{p.member_name ?? p.phone ?? '—'} • {p.created_at ? new Date(p.created_at).toLocaleString() : '—'}</div>
                    {p.church_id && <div className="text-xs text-gray-400"><Link href={`/admin/churches/${p.church_id}`} className="text-sky-600">View church</Link></div>}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-semibold">{fmtNumber(num(p.amount ?? 0))} {p.currency ?? ''}</div>
                  <div className="text-xs mt-1"><Link href={`/admin/finance/payments/${p.id}`} className="text-sky-600">Details</Link></div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">Showing {recents.length} payments</div>
          <div className="flex gap-2">
            <button onClick={handleLoadMore} disabled={isLoadingMore || (lastPage !== null && page >= lastPage)} className="px-3 py-1 border rounded text-sm disabled:opacity-50">
              {isLoadingMore ? 'Loading…' : ((lastPage !== null && page >= lastPage) ? 'No more' : 'Load more')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}