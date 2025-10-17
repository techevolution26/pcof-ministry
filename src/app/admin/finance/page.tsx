// app/admin/finance/page.tsx
'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { apiGet, fetchChurchesList } from '@/lib/adminApi'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faRefresh,
  faPlus,
  faSearch,
  faEye,
  faFileInvoice,
  faMoneyBillWave,
  faChartLine,
  faClock,
  faChurch,
  faCalendar,
  faExclamationTriangle,
  faSpinner,
  faArrowRight,
  faFilter,
  faCheckCircle,
  faTimesCircle,
  faHourglassHalf
} from '@fortawesome/free-solid-svg-icons'

// Types
interface FinanceSummary {
  donations_total: number
  tithes_30d: number
  collections_pending: number
  recent_payments: unknown[]
  raw?: unknown
}

interface PaymentItem {
  id: string | number
  amount: number
  currency: string
  type: string
  member_name?: string
  phone?: string
  reference?: string
  created_at?: string
  church_id?: string | number
  church_name?: string
  status?: string
  description?: string
  metadata?: unknown
  _synthetic?: boolean
  _origId?: string | number
  _isNumericId?: boolean
}

export default function AdminFinancePage() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Controls
  const [churchId, setChurchId] = useState<string | number | ''>('')
  const [recentCount, setRecentCount] = useState<number>(20)
  const [page, setPage] = useState<number>(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [lastPage, setLastPage] = useState<number | null>(null)

  const [churches, setChurches] = useState<unknown[]>([])

  // Modal state
  const [inspecting, setInspecting] = useState<PaymentItem | null>(null)
  const [resolvedPayment, setResolvedPayment] = useState<unknown | null>(null)
  const [resolving, setResolving] = useState(false)
  const [resolveError, setResolveError] = useState<string | null>(null)
  const [breakdown, setBreakdown] = useState<unknown[] | null>(null)
  const [breakdownLoading, setBreakdownLoading] = useState(false)
  const modalRef = useRef<HTMLDivElement | null>(null)

  // Enhanced number utilities
  const num = (v: unknown): number => {
    if (v === null || v === undefined || v === '') return 0
    const n = typeof v === 'number' ? v : Number(String(v).replace(/,/g, '') || 0)
    return Number.isFinite(n) ? n : 0
  }

  const fmtNumber = (v: number): string => {
    try {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(v)
    } catch {
      return String(v)
    }
  }

  const fmtCurrency = (amount: number, currency: string = 'KES'): string => {
    return `${fmtNumber(amount)} ${currency}`
  }

  // Enhanced classification
  const isAggregate = (p: unknown): boolean => {
    if (!p) return false
    return (
      (('total' in p || 'amount_total' in p) &&
        ('count' in p || 'items' in p)) &&
      (!p.id || String(p.id).startsWith('missing-'))
    )
  }

  const getSafeRecentPayments = (payments: unknown[]): PaymentItem[] => {
    const seenIds = new Set<string>()
    const safePayments: PaymentItem[] = []
    let duplicateCount = 0
    let missingIdCount = 0

    payments.forEach((p, index) => {
      const rawId = p?.id
      const idStr = rawId == null ? '' : String(rawId)
      const isNumericString = /^\d+$/.test(idStr)

      if (!rawId) {
        missingIdCount++
        const syntheticId = `missing-${index}-${Date.now()}`
        safePayments.push({
          ...p,
          id: syntheticId,
          _synthetic: true,
          _origId: rawId ?? null
        })
      } else if (seenIds.has(String(rawId))) {
        duplicateCount++
        const uniqueId = `${rawId}-dup-${index}`
        safePayments.push({
          ...p,
          id: uniqueId,
          _synthetic: true,
          _origId: rawId
        })
      } else {
        seenIds.add(String(rawId))
        safePayments.push({
          ...p,
          _synthetic: false,
          _origId: rawId,
          _isNumericId: isNumericString
        })
      }
    })

    if (duplicateCount > 0 || missingIdCount > 0) {
      console.warn(`Payment list issues: ${duplicateCount} duplicates, ${missingIdCount} missing IDs`)
    }

    return safePayments
  }

  const hasRealId = (p: PaymentItem): boolean => {
    if (p._synthetic) return false
    const id = p.id
    if (typeof id === 'number') return true
    if (typeof id === 'string' && /^\d+$/.test(id)) return true
    return false
  }

  const getPaymentStatusColor = (status: string): string => {
    const statusColors: Record<string, string> = {
      completed: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      submitted: 'bg-blue-100 text-blue-800 border-blue-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    }
    return statusColors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getPaymentStatusIcon = (status: string) => {
    const statusIcons: Record<string, unknown> = {
      completed: faCheckCircle,
      pending: faHourglassHalf,
      failed: faTimesCircle,
      submitted: faClock,
      approved: faCheckCircle,
      rejected: faTimesCircle
    }
    return statusIcons[status?.toLowerCase()] || faFileInvoice
  }

  const getPaymentTypeColor = (type: string): string => {
    const typeColors: Record<string, string> = {
      tithe: 'bg-purple-100 text-purple-800 border-purple-200',
      offering: 'bg-blue-100 text-blue-800 border-blue-200',
      collection: 'bg-green-100 text-green-800 border-green-200',
      event_fee: 'bg-orange-100 text-orange-800 border-orange-200',
      donation: 'bg-teal-100 text-teal-800 border-teal-200'
    }
    return typeColors[type?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getPaymentTypeIcon = (type: string) => {
    const typeIcons: Record<string, unknown> = {
      tithe: faMoneyBillWave,
      offering: faFileInvoice,
      collection: faMoneyBillWave,
      event_fee: faCalendar,
      donation: faMoneyBillWave
    }
    return typeIcons[type?.toLowerCase()] || faFileInvoice
  }

  // Enhanced load function
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
    } catch (err: unknown) {
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

  const recentsRaw = (summary?.recent_payments ?? []) as unknown[]
  const safeRecentsRaw = getSafeRecentPayments(recentsRaw)
  const recents = safeRecentsRaw.slice(0, recentCount)

  async function handleLoadMore() {
    if (lastPage !== null && page >= lastPage) return
    setIsLoadingMore(true)
    try {
      const next = page + 1
      await load({ page: next })
      setPage(next)
    } catch (err: unknown) {
      console.error(err)
    } finally {
      setIsLoadingMore(false)
    }
  }

  // Modal handlers
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
    } catch (err: unknown) {
      console.error('Resolve failed', err)
      setResolvedPayment(null)
      setResolveError(err?.message ?? 'Failed to resolve reference')
    } finally {
      setResolving(false)
    }
  }

  async function fetchBreakdownForAggregate(item: unknown) {
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
      const rows = Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : (body?.payments ?? body?.data ?? []))
      setBreakdown(rows)
    } catch (err: unknown) {
      console.error('Failed to fetch breakdown', err)
      setBreakdown([])
    } finally {
      setBreakdownLoading(false)
    }
  }

  // Enhanced auto-resolution
  useEffect(() => {
    if (!inspecting) {
      setResolvedPayment(null)
      setResolveError(null)
      setBreakdown(null)
      setResolving(false)
      return
    }

    if (isAggregate(inspecting)) {
      fetchBreakdownForAggregate(inspecting)
      return
    }

    if (inspecting.reference) {
      resolveByReference(inspecting.reference)
      return
    }

    setResolveError('No reference to resolve.')
  }, [inspecting])

  // Loading state with icons
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
              <div>
                <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-96"></div>
              </div>
              <div className="flex gap-3">
                <div className="h-10 bg-gray-200 rounded w-32"></div>
                <div className="h-10 bg-gray-200 rounded w-32"></div>
              </div>
            </div>

            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded w-32"></div>
                    </div>
                    <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Table Skeleton */}
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 shadow-sm">
              <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg mb-3"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state with icons
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 text-center shadow-xl">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 dark:text-red-400 text-2xl" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Unable to Load Finance Data</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => load({ refresh: true })}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center gap-2 mx-auto"
          >
            <FontAwesomeIcon icon={faRefresh} />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                Finance Dashboard
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 font-light max-w-2xl">
                Monitor payments, collections, tithes, and financial activities across all churches
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Church Filter */}
              <div className="relative">
                <FontAwesomeIcon icon={faChurch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                <select
                  value={churchId}
                  onChange={(e) => { setChurchId(e.target.value); setPage(1) }}
                  className="pl-10 pr-8 py-2.5 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm appearance-none cursor-pointer"
                >
                  <option value="">All Churches</option>
                  {churches.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Items Count */}
              <div className="relative">
                <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                <select
                  value={String(recentCount)}
                  onChange={(e) => { setRecentCount(Number(e.target.value) || 10); setPage(1) }}
                  className="pl-10 pr-8 py-2.5 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm appearance-none cursor-pointer"
                >
                  <option value="10">10 items</option>
                  <option value="20">20 items</option>
                  <option value="50">50 items</option>
                  <option value="100">100 items</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => load({ refresh: true, page: 1 })}
                  className="px-4 py-2.5 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors duration-200 flex items-center gap-2 backdrop-blur-sm"
                >
                  <FontAwesomeIcon icon={faRefresh} className="text-gray-600 dark:text-gray-400" />
                  <span className="hidden sm:inline">Refresh</span>
                </button>

                <Link
                  href="/admin/finance/payments/new"
                  className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <FontAwesomeIcon icon={faPlus} />
                  <span>New Payment</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Donations Card */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Donations</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {fmtCurrency(summary?.donations_total || 0)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">All time collected amount</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <FontAwesomeIcon icon={faMoneyBillWave} className="text-white text-xl" />
              </div>
            </div>
          </div>

          {/* 30-Day Tithes Card */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">30-Day Tithes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {fmtCurrency(summary?.tithes_30d || 0)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Recent tithe collections</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <FontAwesomeIcon icon={faChartLine} className="text-white text-xl" />
              </div>
            </div>
          </div>

          {/* Pending Collections Card */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Pending Collections</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {fmtCurrency(summary?.collections_pending || 0)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Awaiting processing</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                <FontAwesomeIcon icon={faClock} className="text-white text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Payments Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 overflow-hidden">
          {/* Section Header */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                  <FontAwesomeIcon icon={faFileInvoice} className="text-blue-500" />
                  Recent Payments
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Showing {recents.length} of {recentsRaw.length} payments
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Page {page} {lastPage && `of ${lastPage}`}
                </div>
                <Link
                  href="/admin/finance/payments"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium flex items-center gap-1"
                >
                  View All
                  <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                </Link>
              </div>
            </div>
          </div>

          {/* Payments List */}
          <div className="p-6">
            {recents.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FontAwesomeIcon icon={faFileInvoice} className="text-gray-400 text-2xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Recent Payments</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  No payments found for the selected criteria. Try adjusting your filters or create a new payment.
                </p>
                <Link
                  href="/admin/finance/payments/new"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 inline-flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faPlus} />
                  Create First Payment
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recents.map((p: PaymentItem) => {
                  const amount = num(p.amount ?? p.total ?? 0)
                  const when = p.created_at ? new Date(p.created_at).toLocaleString() : (p.period_start_date ? `${p.period_start_date}` : '—')
                  const member = p.member_name ?? p.phone ?? 'Unknown'
                  const type = p.type ?? p.collectiontype?.name ?? 'Payment'
                  const aggregate = isAggregate(p)
                  const isReal = hasRealId(p)
                  const detailsHref = isReal ? `/admin/finance/payments/${p.id}` : (p.reference ? `/admin/finance/payments?q=${encodeURIComponent(String(p.reference))}` : null)

                  return (
                    <div
                      key={String(p.id)}
                      className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                    >
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Type Badge */}
                        <div className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-2 ${getPaymentTypeColor(type)}`}>
                          <FontAwesomeIcon icon={getPaymentTypeIcon(type)} className="text-xs" />
                          {type}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {aggregate ? `${type} Summary` : member}
                            </h4>
                            {p.status && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getPaymentStatusColor(p.status)}`}>
                                <FontAwesomeIcon icon={getPaymentStatusIcon(p.status)} className="text-xs" />
                                {p.status}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <FontAwesomeIcon icon={faCalendar} className="text-xs" />
                              {aggregate ? `${p.count ?? 0} items` : when}
                            </span>
                            {p.reference && (
                              <span className="flex items-center gap-1 font-mono">
                                <FontAwesomeIcon icon={faFileInvoice} className="text-xs" />
                                {p.reference}
                              </span>
                            )}
                            {p.church_id && (
                              <Link
                                href={`/admin/churches/${p.church_id}`}
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline flex items-center gap-1"
                              >
                                <FontAwesomeIcon icon={faChurch} className="text-xs" />
                                View Church
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Amount */}
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {fmtCurrency(amount, p.currency)}
                          </div>

                          {/* Actions */}
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {aggregate ? (
                              <button
                                onClick={() => { setInspecting(p); setResolvedPayment(null); setResolveError(null) }}
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-1"
                              >
                                <FontAwesomeIcon icon={faEye} className="text-xs" />
                                View Breakdown
                              </button>
                            ) : isReal ? (
                              <Link
                                href={detailsHref!}
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-1"
                              >
                                <FontAwesomeIcon icon={faEye} className="text-xs" />
                                View Details
                              </Link>
                            ) : (
                              <div className="flex items-center gap-3">
                                {detailsHref && (
                                  <Link
                                    href={detailsHref}
                                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-1"
                                  >
                                    <FontAwesomeIcon icon={faSearch} className="text-xs" />
                                    Search
                                  </Link>
                                )}
                                <button
                                  onClick={() => { setInspecting(p); setResolvedPayment(null); setResolveError(null) }}
                                  className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 font-medium flex items-center gap-1"
                                >
                                  <FontAwesomeIcon icon={faEye} className="text-xs" />
                                  Inspect
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Pagination */}
            {recents.length > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {recents.length} payments • Total {recentsRaw.length}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore || (lastPage !== null && page >= lastPage)}
                    className="px-4 py-2 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2 backdrop-blur-sm"
                  >
                    {isLoadingMore ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                        Loading...
                      </>
                    ) : ((lastPage !== null && page >= lastPage) ? 'No More Payments' : 'Load More')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Modal */}
      {inspecting && (
        <div
          onClick={onOverlayClick}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
          aria-modal="true"
          role="dialog"
        >
          <div
            ref={modalRef}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden transform transition-transform duration-200 scale-100"
          >
            <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FontAwesomeIcon icon={isAggregate(inspecting) ? faChartLine : faFileInvoice} className="text-blue-500" />
                  {isAggregate(inspecting) ? 'Aggregate Breakdown' : 'Payment Details'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {inspecting.reference ?? `ID: ${String(inspecting._origId ?? inspecting.id ?? '')}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!isAggregate(inspecting) && (
                  <button
                    onClick={() => resolveByReference(inspecting.reference)}
                    disabled={!inspecting.reference || resolving}
                    className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faSearch} className="text-xs" />
                    {resolving ? 'Resolving...' : 'Resolve'}
                  </button>
                )}

                <button
                  onClick={() => {
                    setInspecting(null);
                    setResolvedPayment(null);
                    setResolveError(null);
                    setBreakdown(null)
                  }}
                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                >
                  <FontAwesomeIcon icon={faTimesCircle} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              {/* Modal content would continue here... */}
              <div className="text-center py-8 text-gray-500">
                <FontAwesomeIcon icon={faFileInvoice} className="text-4xl mb-4 text-gray-300" />
                <p>Payment inspection modal content</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}