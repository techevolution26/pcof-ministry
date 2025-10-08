// app/admin/church/members/page.tsx
'use client'
import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { fetchChurchMembers, deleteMember } from '@/lib/adminApi'

type Member = {
  id: number | string
  member_number?: string
  first_name?: string
  last_name?: string
  phone?: string | null
  email?: string | null
  assembly?: any
  designation?: any
  department?: any
  [k: string]: any
}

export default function ChurchMembersPage() {
  const { user, isLoading } = useAdminAuth()
  const churchId = user?.church_id

  // list + meta
  const [members, setMembers] = useState<Member[]>([])
  const [meta, setMeta] = useState<{ current_page?: number; last_page?: number; per_page?: number; total?: number }>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // controls
  const [q, setQ] = useState('')
  const [page, setPage] = useState<number>(1)
  const perPage = 25

  // deletion state
  const [deletingId, setDeletingId] = useState<number | string | null>(null)

  // debounce ref
  const searchTimer = useRef<number | null>(null)

  // optimistic-create handoff key
  const CREATED_KEY = 'pcf_recent_created_member'

  // load initial (and re-load when churchId, q or page changes)
  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        if (!churchId) {
          setMembers([])
          setMeta({})
          return
        }

        const body = await fetchChurchMembers({ church_id: churchId, q: q || undefined, page, per_page: perPage })
        if (!mounted) return

        // Normalized shapes:
        // - Laravel paginator returns { data: [...], current_page, last_page, per_page, total }
        // - Some APIs return { data: [...], meta: { ... } }
        const list = Array.isArray(body) ? body : (body?.data ?? body?.results ?? [])
        const pagination = body?.meta ?? {
          current_page: body?.current_page ?? body?.page ?? page,
          last_page: body?.last_page ?? body?.lastPage ?? body?.last ?? 1,
          per_page: body?.per_page ?? body?.perPage ?? perPage,
          total: body?.total ?? (Array.isArray(list) ? list.length : 0),
        }

        setMembers(list)
        setMeta({
          current_page: Number(pagination.current_page ?? page),
          last_page: Number(pagination.last_page ?? 1),
          per_page: Number(pagination.per_page ?? perPage),
          total: Number(pagination.total ?? (Array.isArray(list) ? list.length : 0)),
        })
      } catch (err: any) {
        console.error('Failed loading members', err)
        if (!mounted) return
        setError(err?.message ?? 'Failed to load members')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    // small debounce for search changes
    if (searchTimer.current) window.clearTimeout(searchTimer.current)
    searchTimer.current = window.setTimeout(() => {
      load()
    }, 200)

    return () => {
      mounted = false
      if (searchTimer.current) window.clearTimeout(searchTimer.current)
    }
  }, [churchId, q, page])

  // apply optimistic append if a newly created member was handed off via localStorage
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(CREATED_KEY) : null
      if (!raw) return
      const item = JSON.parse(raw)
      // only inject if it belongs to this church (safe-guard)
      if (item && item.church_id && String(item.church_id) === String(churchId)) {
        setMembers(prev => {
          // avoid duplicates
          const exists = prev.find(m => String(m.id) === String(item.id))
          if (exists) return prev
          // prepend to front of current page list for visibility
          return [item, ...prev].slice(0, perPage)
        })
        // update meta.total if present
        setMeta(prev => ({ ...prev, total: (Number(prev.total ?? 0) + 1) }))
      }
      localStorage.removeItem(CREATED_KEY)
    } catch {
      // ignore parse errors
      localStorage.removeItem(CREATED_KEY)
    }
    // run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [churchId])

  // delete handler with confirmation + optimistic update
  async function handleDelete(member: Member) {
    const ok = window.confirm(`Delete member "${[member.first_name, member.last_name].filter(Boolean).join(' ')}"? This cannot be undone.`)
    if (!ok) return

    const prev = members
    setDeletingId(member.id)
    // optimistic remove
    setMembers(prevList => prevList.filter(m => String(m.id) !== String(member.id)))
    setMeta(prevMeta => ({ ...prevMeta, total: Math.max(0, Number(prevMeta.total ?? 1) - 1) }))

    try {
      await deleteMember(member.id)
      // success – nothing else to do
    } catch (err: any) {
      // restore on failure
      console.error('Delete failed', err)
      setMembers(prev) // restore
      setMeta(prevMeta => ({ ...prevMeta, total: Number(prevMeta.total ?? 0) + 1 }))
      setError(err?.message ?? 'Failed to delete member')
    } finally {
      setDeletingId(null)
    }
  }

  // page navigation helpers
  const currentPage = Number(meta.current_page ?? page)
  const lastPage = Number(meta.last_page ?? page)

  // UI rendering
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold">Members</h1>
          <div className="text-sm text-gray-500">{meta.total ?? members.length} total</div>
        </div>

        <div className="flex items-center gap-3">
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1) }}
            placeholder="Search by name, # or phone"
            className="p-2 border rounded w-64 text-sm"
          />
          <Link href="/admin/church/members/new" className="px-3 py-1 bg-sky-600 text-white rounded text-sm">Add member</Link>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-gray-500">
            <tr>
              <th className="p-2">#</th>
              <th className="p-2">Name</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Department</th>
              <th className="p-2">Designation</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              // skeleton rows
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="border-t">
                  <td className="p-4"><div className="h-4 bg-gray-200 rounded w-20 animate-pulse" /></td>
                  <td className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-40 animate-pulse mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-36 animate-pulse" />
                  </td>
                  <td className="p-4"><div className="h-4 bg-gray-200 rounded w-24 animate-pulse" /></td>
                  <td className="p-4"><div className="h-4 bg-gray-200 rounded w-24 animate-pulse" /></td>
                  <td className="p-4"><div className="h-4 bg-gray-200 rounded w-24 animate-pulse" /></td>
                  <td className="p-2" />
                </tr>
              ))
            ) : (
              members.map(m => {
                const fullName = [m.first_name, m.last_name].filter(Boolean).join(' ')
                return (
                  <tr
                    key={m.id}
                    className="border-t hover:bg-slate-50 transition-colors"
                    // clickable row -> open view page
                    onClick={() => { window.location.href = `/admin/church/members/${m.id}` }}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="p-2 align-top w-28">{m.member_number ?? m.id}</td>

                    <td className="p-2">
                      <div className="font-medium">{fullName || '—'}</div>
                      <div className="text-xs text-gray-500">{m.email ?? ''}</div>
                    </td>

                    <td className="p-2">{m.phone ?? '—'}</td>

                    <td className="p-2">{m.department?.name ?? (m.department_id ? String(m.department_id) : '—')}</td>

                    <td className="p-2">{m.designation?.name ?? (m.designation_id ? String(m.designation_id) : '—')}</td>

                    <td className="p-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-3">
                        <Link href={`/admin/church/members/${m.id}`} className="text-sky-600 text-sm">View</Link>
                        <Link href={`/admin/church/members/${m.id}/edit`} className="text-gray-700 text-sm">Edit</Link>
                        <button
                          onClick={() => handleDelete(m)}
                          disabled={deletingId === m.id}
                          className="text-sm text-red-600 hover:underline disabled:opacity-50"
                          aria-disabled={deletingId === m.id}
                        >
                          {deletingId === m.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}

            {!loading && members.length === 0 && (
              <tr><td colSpan={6} className="p-4 text-center text-gray-500">No members found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">Showing {members.length} of {meta.total ?? members.length}</div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setPage(1) }} disabled={currentPage <= 1} className="px-3 py-1 border rounded text-sm disabled:opacity-50">First</button>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Prev</button>

          <div className="px-3 py-1 border rounded text-sm">{currentPage} / {lastPage}</div>

          <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={currentPage >= lastPage} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Next</button>
          <button onClick={() => setPage(lastPage)} disabled={currentPage >= lastPage} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Last</button>
        </div>
      </div>

      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
    </div>
  )
}

