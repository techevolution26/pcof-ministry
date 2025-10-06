'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { apiGet } from '@/lib/adminApi'
import Link from 'next/link'

type PaymentRow = {
  id: number | string
  type?: string
  amount?: number | string
  currency?: string | null
  reference?: string | null
  created_at?: string | null
  member_name?: string | null
  phone?: string | null
  church_id?: number | string | null
}

export default function AdminFinancePage() {
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // recent payments paging
  const [page, setPage] = useState<number>(1)
  const [pageSize] = useState<number>(20)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [lastPage, setLastPage] = useState<number | null>(null)

  const num = (v: any) => {
    if (v === null || v === undefined || v === '') return 0
    const n = typeof v === 'number' ? v : Number(String(v).replace(/,/g, '') || 0)
    return Number.isFinite(n) ? n : 0
  }

  const fmtNumber = (value: number) => {
    try {
      return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value)
    } catch {
      return String(value)
    }
  }

  // Safe payment processing function to handle duplicate and missing IDs
  const getSafeRecentPayments = (payments: PaymentRow[]): PaymentRow[] => {
    const seenIds = new Set()
    const safePayments: PaymentRow[] = []
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
      const path = `/api/admin/finance/summary${p && p > 1 ? `?page=${p}` : ''}`
      const body = await apiGet(path)

      const recent = Array.isArray(body?.recent_payments)
        ? body.recent_payments
        : Array.isArray(body?.payments)
          ? body.payments
          : (body?.data ?? [])

      const meta = body?.meta ?? body?.pagination ?? null
      setLastPage(meta?.last_page ?? meta?.lastPage ?? null)

      const normalized = {
        donations_total: num(body?.donations_total ?? body?.total_payments ?? body?.total ?? 0),
        tithes_30d: num(body?.tithes_30d ?? body?.total_tithes ?? (body?.tithes?.total ?? 0)),
        collections_pending: num(body?.collections_pending ?? body?.pending ?? 0),
        recent_payments: recent,
        raw: body,
      }

      setSummary(normalized)
      setError(null)
    } catch (err: any) {
      console.error('Failed to load finance summary', err)
      setError(err?.message ?? 'Failed to load finance summary')
      setSummary(null)
      setLastPage(null)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    let mounted = true
      ; (async () => {
        if (!mounted) return
        await load({ refresh: true, page: 1 })
      })()
    return () => { mounted = false }
  }, [load])

  async function handleLoadMore() {
    // if we know lastPage and we're already at the end, don't call
    if (lastPage !== null && page >= lastPage) return
    setIsLoadingMore(true)
    try {
      const next = page + 1
      const path = `/api/admin/finance/summary?page=${next}`
      const body = await apiGet(path)

      const more = Array.isArray(body?.recent_payments) ? body.recent_payments : (Array.isArray(body?.payments) ? body.payments : (body?.data ?? []))

      if (!more || more.length === 0) {
        setIsLoadingMore(false)
        setLastPage(next - 1) // no more data
        return
      }

      setSummary((prev: any) => ({
        ...prev,
        recent_payments: [...(prev?.recent_payments ?? []), ...more],
        raw: body ?? prev?.raw
      }))

      const meta = body?.meta ?? body?.pagination ?? null
      setLastPage(meta?.last_page ?? meta?.lastPage ?? null)
      setPage(next)
    } catch (err: any) {
      console.error('Failed to load more payments', err)
      setError(err?.message ?? 'Failed to load more payments')
    } finally {
      setIsLoadingMore(false)
    }
  }

  const refresh = async () => {
    setLoading(true)
    setPage(1)
    await load({ refresh: true, page: 1 })
  }

  if (loading) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Finance</h1>
          <div className="text-sm text-gray-500">Loading…</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="p-4 bg-white rounded shadow animate-pulse h-24" />
          <div className="p-4 bg-white rounded shadow animate-pulse h-24" />
          <div className="p-4 bg-white rounded shadow animate-pulse h-24" />
        </div>

        <div className="bg-white rounded shadow p-4">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-3" />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>
  }

  const recent: PaymentRow[] = summary?.recent_payments ?? []
  const safeRecent = getSafeRecentPayments(recent)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Finance</h1>
          <div className="text-sm text-gray-500">Overview of collections, tithes and recent payments</div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={refresh} className="px-3 py-2 bg-white border rounded text-sm hover:bg-gray-50">Refresh</button>
          <Link href="/admin/finance/payments/new" className="px-3 py-2 bg-indigo-600 text-white rounded text-sm">New Payment</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Total Donations (last {summary?.raw?.days ?? 30}d)</div>
          <div className="text-2xl font-bold mt-2">{fmtNumber(num(summary?.donations_total ?? summary?.raw?.total_payments ?? 0))}</div>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Tithes (30d)</div>
          <div className="text-2xl font-bold mt-2">{fmtNumber(num(summary?.tithes_30d ?? summary?.raw?.total_tithes ?? 0))}</div>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Pending Collections</div>
          <div className="text-2xl font-bold mt-2">{fmtNumber(num(summary?.collections_pending ?? 0))}</div>
        </div>
      </div>

      <div className="bg-white rounded shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent Payments</h2>
          <div className="text-sm text-gray-500">{safeRecent.length} shown</div>
        </div>

        {safeRecent.length === 0 ? (
          <div className="text-sm text-gray-500">No recent payments</div>
        ) : (
          <ul className="divide-y">
            {safeRecent.map((p: PaymentRow) => {
              const amount = fmtNumber(num(p.amount ?? 0))
              const when = p.created_at ? new Date(p.created_at).toLocaleString() : '—'
              const member = p.member_name ?? p.phone ?? 'Unknown'
              const type = p.type ?? 'Payment'
              return (
                <li key={String(p.id)} className="py-3 flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="px-2 py-1 bg-slate-100 text-xs rounded font-medium text-slate-700">{type}</div>
                    </div>

                    <div>
                      <div className="font-medium">{type} — <span className="text-slate-500 text-sm">{p.reference ?? p.id}</span></div>
                      <div className="text-xs text-gray-500">{member} • {when}</div>
                      {p.church_id && (
                        <div className="text-xs text-gray-400 mt-1">
                          <Link href={`/admin/churches/${p.church_id}`} className="text-sky-600">View church</Link>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold">{amount} {p.currency ?? ''}</div>
                    <div className="text-xs mt-1">
                      <Link href={`/admin/finance/payments/${p.id}`} className="text-sky-600">Details</Link>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">Showing {safeRecent.length} payments</div>
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