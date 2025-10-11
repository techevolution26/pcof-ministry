'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiGet, deleteChurch } from '@/lib/adminApi'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChurch,
  faSearch,
  faPlus,
  faEye,
  faEdit,
  faTrash,
  faUsers,
  faUserTie,
  faSpinner,
  faArrowLeft,
  faArrowRight,
  faAngleDoubleLeft,
  faAngleDoubleRight
} from '@fortawesome/free-solid-svg-icons'

export default function AdminChurchesPage() {
  const router = useRouter()

  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // search / paging
  const [q, setQ] = useState<string>('')
  const [debouncedQ, setDebouncedQ] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const [perPage, setPerPage] = useState<number>(20)

  // pagination meta from backend
  const [total, setTotal] = useState<number>(0)
  const [lastPage, setLastPage] = useState<number>(1)

  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 350)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const qs = new URLSearchParams()
        if (debouncedQ) qs.set('q', debouncedQ)
        if (perPage) qs.set('per_page', String(perPage))
        if (page) qs.set('page', String(page))

        const path = `/api/admin/churches${qs.toString() ? `?${qs.toString()}` : ''}`
        const body = await apiGet(path)

        console.debug('[admin/churches] response body:', body)

        const list = Array.isArray(body)
          ? body
          : (body?.data ?? body?.items ?? body?.rows ?? [])

        const metaCandidates = [
          body?.meta,
          body?.pagination,
          body?.meta?.pagination,
          body?.data?.meta,
          body?.data?.pagination,
          {
            total: body?.total ?? body?.count ?? null,
            per_page: body?.per_page ?? body?.perPage ?? null,
            current_page: body?.current_page ?? body?.page ?? null,
            last_page: body?.last_page ?? body?.lastPage ?? null,
          }
        ]

        let meta = null
        for (const candidate of metaCandidates) {
          if (!candidate) continue
          const hasUseful = (candidate?.total ?? candidate?.last_page ?? candidate?.per_page ?? candidate?.perPage ?? candidate?.current_page) !== undefined && (candidate?.total !== null || candidate?.last_page !== undefined || candidate?.per_page !== undefined)
          if (hasUseful) { meta = candidate; break }
        }

        const total = Number(meta?.total ?? meta?.total_count ?? meta?.count ?? (Array.isArray(list) ? list.length : 0))
        const per = Number(meta?.per_page ?? meta?.perPage ?? perPage)
        const current = Number(meta?.current_page ?? meta?.page ?? page)
        const last = Number(meta?.last_page ?? meta?.lastPage ?? (per > 0 ? Math.ceil(total / per) : 1)) || 1

        if (!mounted) return

        setItems(list)
        setTotal(Number.isFinite(total) ? total : (Array.isArray(list) ? list.length : 0))
        setLastPage(Number.isFinite(last) ? last : 1)
        if (current && current !== page) setPage(current)
      } catch (err: any) {
        if (!mounted) return
        console.error('Failed to load churches', err)
        setError(err?.message ?? 'Failed to load churches')
        setItems([])
        setTotal(0)
        setLastPage(1)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [debouncedQ, perPage, page, router])

  async function handleDelete(id: number | string) {
    if (!confirm('Are you sure you want to delete this church? This action cannot be undone.')) return
    try {
      await deleteChurch(id)
      const remaining = items.filter(c => String(c.id) !== String(id)).length
      if (remaining === 0 && page > 1) setPage(p => p - 1)
      else {
        setItems(prev => prev.filter(c => String(c.id) !== String(id)))
        setTotal(t => Math.max(0, t - 1))
      }
    } catch (err: any) {
      console.error(err)
      alert(err?.message ?? 'Delete failed')
    }
  }

  function gotoPage(p: number) {
    if (p < 1) p = 1
    if (p > lastPage) p = lastPage
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
              Churches Management
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Manage churches and branches across your organization
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/churches/new"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 font-semibold"
            >
              <FontAwesomeIcon icon={faPlus} className="text-sm" />
              Create Church
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 max-w-2xl">
              <div className="relative flex-1">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"
                />
                <input
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setPage(1) }}
                  placeholder="Search churches by name, pastor, or location..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  aria-label="Search churches"
                />
              </div>
              <button
                onClick={() => { setQ(''); setPage(1) }}
                className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Clear
              </button>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Show</label>
              <select
                value={perPage}
                onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }}
                className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-500 dark:text-gray-400">per page</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 overflow-hidden">
          <div className="overflow-auto">
            <table className="w-full text-left text-sm min-w-[800px]">
              <thead className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                <tr>
                  <th className="p-6 font-semibold text-gray-700 dark:text-gray-200 text-base">Church Details</th>
                  <th className="p-6 font-semibold text-gray-700 dark:text-gray-200 text-base">Branch</th>
                  <th className="p-6 font-semibold text-gray-700 dark:text-gray-200 text-base">Pastor</th>
                  <th className="p-6 font-semibold text-gray-700 dark:text-gray-200 text-base">Members</th>
                  <th className="p-6 font-semibold text-gray-700 dark:text-gray-200 text-base">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  Array.from({ length: perPage > 20 ? 10 : perPage }).map((_, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
                          <div className="space-y-2">
                            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          </div>
                        </div>
                      </td>
                      <td className="p-6"><div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>
                      <td className="p-6"><div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>
                      <td className="p-6"><div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>
                      <td className="p-6"><div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" /></td>
                    </tr>
                  ))
                ) : (
                  <>
                    {items.map((c) => (
                      <tr key={c.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                              <FontAwesomeIcon icon={faChurch} className="text-white text-lg" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white text-lg">{c.name}</div>
                              {c.slug && (
                                <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-1">
                                  /{c.slug}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            {c.branch || 'Main'}
                          </span>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faUserTie} className="text-gray-400 text-sm" />
                            <span className="text-gray-700 dark:text-gray-300">{c.pastor || '—'}</span>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faUsers} className="text-gray-400 text-sm" />
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {c.members_count ?? c.member_count ?? '0'}
                            </span>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <Link
                              href={`/admin/churches/${c.id}`}
                              className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
                              title="View Church"
                            >
                              <FontAwesomeIcon icon={faEye} className="text-sm" />
                            </Link>
                            <Link
                              href={`/admin/churches/${c.id}/edit`}
                              className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg flex items-center justify-center hover:bg-green-200 dark:hover:bg-green-800/50 transition-colors"
                              title="Edit Church"
                            >
                              <FontAwesomeIcon icon={faEdit} className="text-sm" />
                            </Link>
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="w-10 h-10 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors"
                              title="Delete Church"
                            >
                              <FontAwesomeIcon icon={faTrash} className="text-sm" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {items.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-12 text-center">
                          <div className="flex flex-col items-center justify-center gap-4">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                              <FontAwesomeIcon icon={faChurch} className="text-gray-400 text-2xl" />
                            </div>
                            <div className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                              No churches found
                            </div>
                            {debouncedQ ? (
                              <p className="text-gray-400 dark:text-gray-500 max-w-md">
                                No churches match your search criteria. Try adjusting your search terms or clear the filters.
                              </p>
                            ) : (
                              <p className="text-gray-400 dark:text-gray-500 max-w-md">
                                Get started by creating your first church in the organization.
                              </p>
                            )}
                            <Link
                              href="/admin/churches/new"
                              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 font-semibold mt-4"
                            >
                              <FontAwesomeIcon icon={faPlus} className="text-sm" />
                              Create Your First Church
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing <strong className="text-gray-900 dark:text-white">{items.length}</strong> of{' '}
            <strong className="text-gray-900 dark:text-white">{total}</strong> churches
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => gotoPage(1)}
              disabled={page <= 1}
              className="w-10 h-10 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FontAwesomeIcon icon={faAngleDoubleLeft} className="text-gray-600 dark:text-gray-400 text-sm" />
            </button>
            <button
              onClick={() => gotoPage(page - 1)}
              disabled={page <= 1}
              className="w-10 h-10 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="text-gray-600 dark:text-gray-400 text-sm" />
            </button>

            <div className="flex items-center gap-1 mx-2">
              <span className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Page {page} of {lastPage}
              </span>
            </div>

            <button
              onClick={() => gotoPage(page + 1)}
              disabled={page >= lastPage}
              className="w-10 h-10 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FontAwesomeIcon icon={faArrowRight} className="text-gray-600 dark:text-gray-400 text-sm" />
            </button>
            <button
              onClick={() => gotoPage(lastPage)}
              disabled={page >= lastPage}
              className="w-10 h-10 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FontAwesomeIcon icon={faAngleDoubleRight} className="text-gray-600 dark:text-gray-400 text-sm" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}