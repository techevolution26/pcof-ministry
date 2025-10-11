// app/admin/finance/payments/page.tsx
'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchPayments } from '@/lib/adminApi'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlus,
  faSearch,
  faEye,
  faFileInvoice,
  faMoneyBillWave,
  faCalendar,
  faCheckCircle,
  faTimesCircle,
  faHourglassHalf,
  faArrowRight,
  faArrowLeft,
  faArrowRotateLeft,
  faFilter,
  faDownload
} from '@fortawesome/free-solid-svg-icons'

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
    const statusIcons: Record<string, any> = {
      completed: faCheckCircle,
      pending: faHourglassHalf,
      failed: faTimesCircle,
      submitted: faHourglassHalf,
      approved: faCheckCircle,
      rejected: faTimesCircle
    }
    return statusIcons[status?.toLowerCase()] || faFileInvoice
  }

  const getPaymentTypeIcon = (type: string) => {
    const typeIcons: Record<string, any> = {
      tithe: faMoneyBillWave,
      offering: faFileInvoice,
      collection: faMoneyBillWave,
      event_fee: faCalendar,
      donation: faMoneyBillWave
    }
    return typeIcons[type?.toLowerCase()] || faFileInvoice
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                Payments Management
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 font-light">
                View and manage all payment transactions across churches
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/admin/finance"
                className="px-4 py-2.5 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors duration-200 flex items-center gap-2 backdrop-blur-sm"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="text-gray-600 dark:text-gray-400" />
                Back to Dashboard
              </Link>

              <Link
                href="/admin/finance/payments/new"
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                <FontAwesomeIcon icon={faPlus} />
                New Payment
              </Link>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 dark:border-gray-700/50">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setPage(1) }}
                  placeholder="Search by reference, member name, or type..."
                  className="w-full pl-12 pr-4 py-3 bg-transparent border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <button className="px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 flex items-center gap-2">
                  <FontAwesomeIcon icon={faFilter} className="text-gray-600 dark:text-gray-400" />
                  Filters
                </button>
                <button className="px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 flex items-center gap-2">
                  <FontAwesomeIcon icon={faDownload} className="text-gray-600 dark:text-gray-400" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 dark:bg-gray-700/80 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Type & Member
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                  // Loading Skeleton
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                            <div className="h-3 bg-gray-200 rounded w-32"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-8 bg-gray-200 rounded w-8"></div>
                      </td>
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FontAwesomeIcon icon={faFileInvoice} className="text-gray-400 text-2xl" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Payments Found</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
                        {q ? 'No payments match your search criteria. Try adjusting your search terms.' : 'No payments have been recorded yet.'}
                      </p>
                      {!q && (
                        <Link
                          href="/admin/finance/payments/new"
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 inline-flex items-center gap-2"
                        >
                          <FontAwesomeIcon icon={faPlus} />
                          Create First Payment
                        </Link>
                      )}
                    </td>
                  </tr>
                ) : (
                  items.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <FontAwesomeIcon
                              icon={getPaymentTypeIcon(p.type)}
                              className="text-blue-600 dark:text-blue-400 text-sm"
                            />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white capitalize">
                              {p.type?.replace('_', ' ')}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {p.member_name || p.member?.name || 'Unknown Member'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {Number(p.amount).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {p.currency || 'KES'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getPaymentStatusColor(p.status)}`}>
                          <FontAwesomeIcon icon={getPaymentStatusIcon(p.status)} className="text-xs" />
                          {p.status || 'completed'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono text-sm text-gray-900 dark:text-white">
                          {p.reference || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {new Date(p.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(p.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/finance/payments/${p.id}`}
                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
                            title="View Details"
                          >
                            <FontAwesomeIcon icon={faEye} className="text-sm" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {items.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {items.length} of {total} payments
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(1)}
                disabled={page <= 1}
                className="px-3 py-2 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faArrowRotateLeft} className="text-xs" />
                First
              </button>

              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-2 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
                Prev
              </button>

              <div className="px-4 py-2 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium">
                {page} / {lastPage}
              </div>

              <button
                onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                disabled={page >= lastPage}
                className="px-3 py-2 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
              >
                Next
                <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
              </button>

              <button
                onClick={() => setPage(lastPage)}
                disabled={page >= lastPage}
                className="px-3 py-2 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
              >
                Last
                <FontAwesomeIcon icon={faArrowRotateLeft} className="text-xs transform rotate-180" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}