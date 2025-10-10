// app/admin/finance/page.tsx
'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { apiGet, fetchChurchesList } from '@/lib/adminApi'
import Link from 'next/link'

export default function AdminFinancePage() {
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // controls
  const [churchId, setChurchId] = useState<string | number | ''>('')
  const [recentCount, setRecentCount] = useState<number>(20)
  const [page, setPage] = useState<number>(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [lastPage, setLastPage] = useState<number | null>(null)

  const [churches, setChurches] = useState<any[]>([])

  // modal state
  const [inspecting, setInspecting] = useState<any | null>(null)
  const [resolvedPayment, setResolvedPayment] = useState<any | null>(null)
  const [resolving, setResolving] = useState(false)
  const [resolveError, setResolveError] = useState<string | null>(null)
  const [breakdown, setBreakdown] = useState<any[] | null>(null)
  const [breakdownLoading, setBreakdownLoading] = useState(false)
  const modalRef = useRef<HTMLDivElement | null>(null)

  const num = (v: any) => {
    if (v === null || v === undefined || v === '') return 0
    const n = typeof v === 'number' ? v : Number(String(v).replace(/,/g, '') || 0)
    return Number.isFinite(n) ? n : 0
  }
  const fmtNumber = (v: number) => {
    try { return new Intl.NumberFormat().format(v) } catch { return String(v) }
  }

  // classify items
  const isAggregate = (p: any) => {
    if (!p) return false
    // backend aggregate rows often have total/count keys and are not single payments
    return (('total' in p || 'amount_total' in p) && ('count' in p || 'items' in p)) && (!p.id || String(p.id).startsWith('missing-'))
  }

  const getSafeRecentPayments = (payments: any[]): any[] => {
    const seenIds = new Set<string>()
    const safePayments: any[] = []
    let duplicateCount = 0
    let missingIdCount = 0

    payments.forEach((p, index) => {
      const rawId = p?.id
      const idStr = rawId == null ? '' : String(rawId)
      const isNumericString = /^\d+$/.test(idStr)

      if (!rawId) {
        missingIdCount++
        const syntheticId = `missing-${index}-${Date.now()}`
        safePayments.push({ ...p, id: syntheticId, _synthetic: true, _origId: rawId ?? null })
      } else if (seenIds.has(String(rawId))) {
        duplicateCount++
        const uniqueId = `${rawId}-dup-${index}`
        safePayments.push({ ...p, id: uniqueId, _synthetic: true, _origId: rawId })
      } else {
        seenIds.add(String(rawId))
        safePayments.push({ ...p, _synthetic: false, _origId: rawId, _isNumericId: isNumericString })
      }
    })

    if (duplicateCount > 0 || missingIdCount > 0) {
      console.warn(`Payment list issues: ${duplicateCount} duplicates, ${missingIdCount} missing IDs`)
    }

    return safePayments
  }

  const hasRealId = (p: any) => {
    if (!p) return false
    if (p._synthetic) return false
    const id = p.id
    if (typeof id === 'number') return true
    if (typeof id === 'string' && /^\d+$/.test(id)) return true
    return false
  }

  const load = useCallback(async (opts?: { refresh?: boolean; page?: number }) => {
    const p = opts?.page ?? page
    if (opts?.refresh) setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (churchId) qs.set('church_id', String(churchId))
      if (recentCount) qs.set('recent_limit', String(recentCount))
      if (p && p > 1) qs.set('page', String(p))
      const path = `/api/admin/finance/summary${qs.toString() ? `?${qs.toString()}` : ''}`
      const body = await apiGet(path)

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

  // modal helpers
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && inspecting) {
        setInspecting(null)
        setResolvedPayment(null)
        setResolveError(null)
        setBreakdown(null)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [inspecting])

  function onOverlayClick(e: React.MouseEvent) {
    if (!modalRef.current) return
    if (e.target instanceof Node && modalRef.current.contains(e.target)) return
    setInspecting(null)
    setResolvedPayment(null)
    setResolveError(null)
    setBreakdown(null)
  }

  async function resolveByReference(reference: string | null | undefined) {
    if (!reference) {
      setResolvedPayment(null)
      setResolveError('No reference available to resolve.')
      return
    }
    setResolving(true)
    setResolveError(null)
    setResolvedPayment(null)
    try {
      const path = `/api/admin/finance/payments?reference=${encodeURIComponent(reference)}&per_page=1`
      const body = await apiGet(path)
      const candidates = Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : (body?.payments ?? body?.data ?? []))
      const first = Array.isArray(candidates) && candidates.length > 0 ? candidates[0] : (body && !Array.isArray(body) ? body : null)
      if (first) {
        setResolvedPayment(first)
      } else {
        setResolvedPayment(null)
        setResolveError('No payment found with that reference.')
      }
    } catch (err: any) {
      console.error('Resolve failed', err)
      setResolvedPayment(null)
      setResolveError(err?.message ?? 'Failed to resolve reference')
    } finally {
      setResolving(false)
    }
  }

  async function fetchBreakdownForAggregate(item: any) {
    // item likely has `type` and optionally scope/church
    const type = item?.type ?? item?.collection_type ?? null
    const qs = new URLSearchParams()
    if (type) qs.set('type', String(type))
    if (item?.church_id) qs.set('church_id', String(item.church_id))
    if (churchId) qs.set('church_id', String(churchId))
    qs.set('per_page', '20')
    setBreakdownLoading(true)
    setBreakdown(null)
    try {
      const path = `/api/admin/finance/payments?${qs.toString()}`
      const body = await apiGet(path)
      // body may be paginated — accept body.data or array
      const rows = Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : (body?.payments ?? body?.data ?? []))
      setBreakdown(rows)
    } catch (err: any) {
      console.error('Failed to fetch breakdown', err)
      setBreakdown([])
    } finally {
      setBreakdownLoading(false)
    }
  }

  // when inspecting an item, auto-attempt resolution or breakdown depending on type
  useEffect(() => {
    if (!inspecting) {
      setResolvedPayment(null)
      setResolveError(null)
      setBreakdown(null)
      setResolving(false)
      return
    }

    if (isAggregate(inspecting)) {
      // fetch a sample breakdown for aggregates
      fetchBreakdownForAggregate(inspecting)
      return
    }

    if (inspecting.reference) {
      resolveByReference(inspecting.reference)
      return
    }

    setResolveError('No reference to resolve.')
  }, [inspecting])

  if (loading) return <div className="p-6 text-gray-500">Loading…</div>
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>

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

      <div className="bg-white rounded shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent payments</h2>
          <div className="text-sm text-gray-500">{recents.length} shown</div>
        </div>

        {recents.length === 0 ? (
          <div className="text-sm text-gray-500">No recent payments</div>
        ) : (
          <ul className="divide-y">
            {recents.map((p: any) => {
              const amount = fmtNumber(num(p.amount ?? p.total ?? 0))
              const when = p.created_at ? new Date(p.created_at).toLocaleString() : (p.period_start_date ? `${p.period_start_date}` : '—')
              const member = p.member_name ?? p.phone ?? 'Unknown'
              const type = p.type ?? p.collectiontype?.name ?? 'Payment'
              const aggregate = isAggregate(p)
              const isReal = hasRealId(p)
              const detailsHref = isReal ? `/admin/finance/payments/${p.id}` : (p.reference ? `/admin/finance/payments?q=${encodeURIComponent(String(p.reference))}` : null)

              return (
                <li key={String(p.id)} className="py-3 flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="px-2 py-1 bg-slate-100 text-xs rounded font-medium text-slate-700">{type}</div>
                    <div>
                      <div className="font-medium">
                        {aggregate ? `${type} — ${p.count ?? ''} items` : `${type} — `}
                        <span className="text-slate-500 text-sm">{aggregate ? `Total ${amount}` : (p.reference ?? p.id)}</span>
                      </div>
                      <div className="text-xs text-gray-500">{aggregate ? `Aggregate • ${p.count ?? 0} items` : `${member} • ${when}`}</div>
                      {p.church_id && <div className="text-xs text-gray-400"><Link href={`/admin/churches/${p.church_id}`} className="text-sky-600">View church</Link></div>}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold">{amount} {p.currency ?? ''}</div>

                    <div className="text-xs mt-1">
                      {aggregate ? (
                        <button
                          onClick={() => { setInspecting(p); setResolvedPayment(null); setResolveError(null) }}
                          className="text-sky-600"
                        >
                          View breakdown
                        </button>
                      ) : isReal ? (
                        <Link href={detailsHref!} className="text-sky-600">Details</Link>
                      ) : (
                        <>
                          {detailsHref && <Link href={detailsHref} className="text-sky-600">Search</Link>}
                          <button
                            onClick={() => { setInspecting(p); setResolvedPayment(null); setResolveError(null) }}
                            className="ml-2 text-sm text-slate-600 hover:underline"
                          >
                            Inspect
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
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

      {/* modal */}
      {inspecting && (
        <div onClick={onOverlayClick} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" aria-modal="true" role="dialog">
          <div ref={modalRef} className="bg-white rounded-lg shadow-lg max-w-2xl w-full overflow-auto">
            <div className="flex items-start justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold">{isAggregate(inspecting) ? 'Aggregate breakdown' : 'Inspect payment'}</h3>
                <div className="text-xs text-gray-500">{inspecting.reference ?? `ID: ${String(inspecting._origId ?? inspecting.id ?? '')}`}</div>
              </div>

              <div className="flex items-center gap-2">
                {!isAggregate(inspecting) && (
                  <button onClick={() => resolveByReference(inspecting.reference)} disabled={!inspecting.reference || resolving} className="px-2 py-1 border rounded text-sm">
                    {resolving ? 'Resolving…' : 'Resolve'}
                  </button>
                )}

                <button onClick={() => { setInspecting(null); setResolvedPayment(null); setResolveError(null); setBreakdown(null) }} className="text-sm px-2 py-1 rounded border">
                  Close
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {/* If aggregate show breakdown (sample rows) */}
              {isAggregate(inspecting) ? (
                <>
                  <div>
                    <div className="text-xs text-gray-500">Aggregate</div>
                    <div className="mt-1 font-medium">{inspecting.type ?? inspecting.collectiontype?.name ?? 'Aggregate'}</div>
                    <div className="text-xs text-gray-500">{inspecting.count ?? inspecting.items ?? 0} items • Total {fmtNumber(num(inspecting.total ?? inspecting.amount_total ?? 0))}</div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500">Breakdown (sample)</div>
                    {breakdownLoading ? (
                      <div className="text-sm text-gray-500">Loading breakdown…</div>
                    ) : (breakdown && breakdown.length > 0) ? (
                      <ul className="divide-y">
                        {breakdown.map((b: any) => (
                          <li key={String(b.id ?? b.reference ?? Math.random())} className="py-2 flex items-center justify-between">
                            <div>
                              <div className="font-medium">{b.member_name ?? b.member_id ?? '—'} <span className="text-xs text-gray-400">• {b.reference ?? b.id}</span></div>
                              <div className="text-xs text-gray-500">{b.created_at ? new Date(b.created_at).toLocaleString() : '—'}</div>
                            </div>
                            <div className="font-semibold">{fmtNumber(num(b.amount ?? 0))} {b.currency ?? ''}</div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-sm text-gray-500">No sample rows returned. Use the "Search payments" link to open the payments list filtered by type.</div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/finance/payments?type=${encodeURIComponent(String(inspecting.type ?? ''))}${inspecting.church_id ? `&church_id=${inspecting.church_id}` : ''}`} className="px-3 py-1 border rounded text-sm">Search payments (full)</Link>
                    <button onClick={() => { setInspecting(null); setBreakdown(null) }} className="px-3 py-1 border rounded text-sm">Close</button>
                  </div>
                </>
              ) : (
                <>
                  {/* non-aggregate: resolve-by-reference flow */}
                  <div>
                    <div className="text-xs text-gray-500">Resolve status</div>
                    <div className="mt-1">
                      {resolving ? (
                        <div className="text-sm text-gray-600">Searching by reference…</div>
                      ) : resolveError ? (
                        <div className="text-sm text-red-600">{resolveError}</div>
                      ) : resolvedPayment ? (
                        <div className="p-2 border rounded">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-sm font-medium">{resolvedPayment.type ?? 'Payment'} — <span className="text-xs text-gray-500">{resolvedPayment.reference ?? resolvedPayment.id}</span></div>
                              <div className="text-xs text-gray-500">{resolvedPayment.member_name ?? resolvedPayment.member_id ?? '—'} • {resolvedPayment.created_at ? new Date(resolvedPayment.created_at).toLocaleString() : '—'}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{fmtNumber(num(resolvedPayment.amount ?? 0))} {resolvedPayment.currency ?? ''}</div>
                              <div className="text-xs mt-1"><Link href={`/admin/finance/payments/${resolvedPayment.id}`} className="text-sky-600">Open real payment</Link></div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">No resolved payment yet. {inspecting.reference ? 'Try Resolve.' : 'No reference to resolve.'}</div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500">Type</div>
                      <div className="font-medium">{inspecting.type ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Amount</div>
                      <div className="font-medium">{fmtNumber(num(inspecting.amount ?? 0))} {inspecting.currency ?? ''}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Member</div>
                      <div className="font-medium">{inspecting.member_name ?? inspecting.member_id ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Church</div>
                      <div className="font-medium">{inspecting.church_name ?? inspecting.church_id ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Status</div>
                      <div className="font-medium">{inspecting.status ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Reference</div>
                      <div className="font-medium">{inspecting.reference ?? '—'}</div>
                    </div>
                  </div>

                  {inspecting.description && (
                    <div>
                      <div className="text-xs text-gray-500">Description</div>
                      <div className="whitespace-pre-wrap">{inspecting.description}</div>
                    </div>
                  )}

                  {inspecting.metadata && (
                    <div>
                      <div className="text-xs text-gray-500">Metadata</div>
                      <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto">{typeof inspecting.metadata === 'string' ? inspecting.metadata : JSON.stringify(inspecting.metadata, null, 2)}</pre>
                    </div>
                  )}

                  <div>
                    <div className="text-xs text-gray-500">Raw</div>
                    <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto">{JSON.stringify(inspecting, null, 2)}</pre>
                  </div>

                  <div className="flex justify-end gap-2">
                    {inspecting.reference && (
                      <Link href={`/admin/finance/payments?q=${encodeURIComponent(String(inspecting.reference))}`} className="px-3 py-1 border rounded text-sm">
                        Search payments by reference
                      </Link>
                    )}
                    <button onClick={() => { setInspecting(null); setResolvedPayment(null); setResolveError(null) }} className="px-3 py-1 border rounded text-sm">Close</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
