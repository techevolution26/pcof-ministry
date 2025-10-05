// src/app/admin/churches/page.tsx
'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiGet, deleteChurch } from '@/lib/adminApi'
import { useRouter } from 'next/navigation'

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

  // pagination meta from backend (Laravel paginator)
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

        // Debug: print the raw payload so you can inspect shape in console
        // remove in production
        console.debug('[admin/churches] response body:', body)

        // list (data array) - accept multiple shapes
        const list = Array.isArray(body)
          ? body
          : (body?.data ?? body?.items ?? body?.rows ?? [])

        // possible metadata locations
        const metaCandidates = [
          body?.meta,
          body?.pagination,
          body?.meta?.pagination,
          body?.data?.meta,
          body?.data?.pagination,
          // sometimes APIs return top-level totals
          {
            total: body?.total ?? body?.count ?? null,
            per_page: body?.per_page ?? body?.perPage ?? null,
            current_page: body?.current_page ?? body?.page ?? null,
            last_page: body?.last_page ?? body?.lastPage ?? null,
          }
        ]

        // picking the first candidate that looks valid
        let meta = null
        for (const candidate of metaCandidates) {
          if (!candidate) continue
          const hasUseful = (candidate?.total ?? candidate?.last_page ?? candidate?.per_page ?? candidate?.perPage ?? candidate?.current_page) !== undefined && (candidate?.total !== null || candidate?.last_page !== undefined || candidate?.per_page !== undefined)
          if (hasUseful) { meta = candidate; break }
        }

        // fallback: if there are HTTP headers with pagination (optional), you could read them from the api wrapper — not implemented here

        // compute robustly
        const total = Number(meta?.total ?? meta?.total_count ?? meta?.count ?? (Array.isArray(list) ? list.length : 0))
        const per = Number(meta?.per_page ?? meta?.perPage ?? perPage)
        const current = Number(meta?.current_page ?? meta?.page ?? page)
        const last = Number(meta?.last_page ?? meta?.lastPage ?? (per > 0 ? Math.ceil(total / per) : 1)) || 1

        if (!mounted) return

        setItems(list)
        setTotal(Number.isFinite(total) ? total : (Array.isArray(list) ? list.length : 0))
        setLastPage(Number.isFinite(last) ? last : 1)
        // ensure page state remains consistent with current page if API returned different
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
    // intentionally depend on debouncedQ/perPage/page
  }, [debouncedQ, perPage, page, router])

  async function handleDelete(id: number | string) {
    if (!confirm('Delete this church? This action cannot be undone.')) return
    try {
      await deleteChurch(id)
      // after delete, reload current page (server likely returns updated pagination)
      // if last item on page deleted and page > 1, adjust page down
      const remaining = items.filter(c => String(c.id) !== String(id)).length
      if (remaining === 0 && page > 1) setPage(p => p - 1)
      else {
        // optimistic remove while reloading to reduce perceived latency
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
    // scroll to top of list (optional)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Churches</h1>
          <div className="text-sm text-gray-500">Manage churches and branches</div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/churches/new" className="px-3 py-2 bg-sky-600 text-white rounded shadow">Create church</Link>
        </div>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1) }}
            placeholder="Search churches by name..."
            className="w-full sm:w-96 p-2 border rounded-md"
            aria-label="Search churches"
          />
          <button onClick={() => { setQ(''); setPage(1) }} className="px-3 py-2 border rounded-md text-sm">Clear</button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Per page</label>
          <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }} className="p-2 border rounded">
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full text-left text-sm min-w-[720px]">
          <thead className="text-xs text-gray-500 bg-gray-50 sticky top-0">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Branch</th>
              <th className="p-3">Pastor</th>
              <th className="p-3">Members</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              // loading skeleton rows
              Array.from({ length: perPage > 20 ? 10 : perPage }).map((_, i) => (
                <tr key={i} className="border-t">
                  <td className="p-3">
                    <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                  </td>
                  <td className="p-3"><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></td>
                  <td className="p-3"><div className="h-4 w-32 bg-gray-200 rounded animate-pulse" /></td>
                  <td className="p-3"><div className="h-4 w-12 bg-gray-200 rounded animate-pulse" /></td>
                  <td className="p-3"><div className="h-4 w-36 bg-gray-200 rounded animate-pulse" /></td>
                </tr>
              ))
            ) : (
              <>
                {items.map((c) => (
                  <tr key={c.id} className="border-t last:border-b">
                    <td className="p-3">
                      <div className="font-medium">{c.name}</div>
                      {c.slug && <div className="text-xs text-gray-400">/{c.slug}</div>}
                    </td>
                    <td className="p-3">{c.branch ?? '—'}</td>
                    <td className="p-3">{c.pastor ?? '—'}</td>
                    <td className="p-3">{c.members_count ?? c.member_count ?? '—'}</td>
                    <td className="p-3">
                      <div className="flex gap-2 items-center">
                        <Link href={`/admin/churches/${c.id}`} className="text-sky-600 text-sm">View</Link>
                        <Link href={`/admin/churches/${c.id}/edit`} className="text-gray-600 text-sm">Edit</Link>
                        <button onClick={() => handleDelete(c.id)} className="text-red-600 text-sm">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}

                {items.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-gray-500">
                    No churches found.
                    {debouncedQ ? <div className="mt-2 text-sm">Try a different search term or clear the filter.</div> : <div className="mt-2 text-sm">Create a church to get started.</div>}
                  </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* footer / pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing <strong>{items.length}</strong> of <strong>{total}</strong>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => gotoPage(1)} disabled={page <= 1} className="px-3 py-1 border rounded disabled:opacity-50">First</button>
          <button onClick={() => gotoPage(page - 1)} disabled={page <= 1} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
          <div className="px-3 py-1 border rounded">{page} / {lastPage}</div>
          <button onClick={() => gotoPage(page + 1)} disabled={page >= lastPage} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
          <button onClick={() => gotoPage(lastPage)} disabled={page >= lastPage} className="px-3 py-1 border rounded disabled:opacity-50">Last</button>
        </div>
      </div>
    </div>
  )
}
