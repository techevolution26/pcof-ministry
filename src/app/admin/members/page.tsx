// src/app/admin/members/page.tsx
'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { apiGet, deleteMember } from '@/lib/adminApi'
import { fetchChurchesList } from '@/lib/adminApi'
import Toast from '@/components/Toast'

type Member = any

export default function AdminMembersPage() {
  // list state
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // filters / controls
  const [q, setQ] = useState<string>('')
  const [debouncedQ, setDebouncedQ] = useState<string>('')
  const [churchId, setChurchId] = useState<string | number | ''>('')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [perPage, setPerPage] = useState<number>(20)
  const [page, setPage] = useState<number>(1)

  // pagination meta (if backend sends meta)
  const [total, setTotal] = useState<number | null>(null)
  const [lastPage, setLastPage] = useState<number | null>(null)

  // bulk select
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const selectedCount = useMemo(() => Object.values(selected).filter(Boolean).length, [selected])

  // UI extras
  const [churches, setChurches] = useState<any[]>([])
  const [toast, setToast] = useState<any | null>(null)
  const searchTimer = useRef<number | null>(null)

  // member inspect modal
  const [inspectingMemberId, setInspectingMemberId] = useState<number | string | null>(null)
  const [inspectingMember, setInspectingMember] = useState<Member | null>(null)
  const [inspectingLoading, setInspectingLoading] = useState(false)

  // refs for modal behaviour
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const modalRef = useRef<HTMLDivElement | null>(null)
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)

  // load churches for filter dropdown (superadmin)
  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          const c = await fetchChurchesList()
          if (!mounted) return
          const arr = Array.isArray(c) ? c : (c?.data ?? [])
          setChurches(arr)
        } catch (err) {
          console.warn('failed to load churches', err)
        }
      })()
    return () => { mounted = false }
  }, [])

  // debounce search input
  useEffect(() => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current)
    searchTimer.current = window.setTimeout(() => {
      setDebouncedQ(q.trim())
      setPage(1)
    }, 300) as unknown as number
    return () => { if (searchTimer.current) window.clearTimeout(searchTimer.current) }
  }, [q])

  // core loader
  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const qs = new URLSearchParams()
        if (debouncedQ) qs.set('q', debouncedQ)
        if (churchId) qs.set('church_id', String(churchId))
        if (status && status !== 'all') qs.set('is_active', status === 'active' ? '1' : '0')
        if (perPage) qs.set('per_page', String(perPage))
        if (page) qs.set('page', String(page))

        const path = `/api/admin/members${qs.toString() ? `?${qs.toString()}` : ''}`
        const body = await apiGet(path)
        // body might be: { data: [...], meta: { total, last_page } } OR an array
        const list = Array.isArray(body) ? body : (body?.data ?? [])
        if (!mounted) return
        setMembers(list)
        const meta = body?.meta ?? body?.pagination ?? null
        setTotal(meta?.total ?? null)
        setLastPage(meta?.last_page ?? meta?.lastPage ?? null)
        setError(null)
      } catch (err: any) {
        console.error('load members failed', err)
        if (!mounted) return
        setMembers([])
        setError(err?.message ?? 'Failed to load members')
        setTotal(null)
        setLastPage(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [debouncedQ, churchId, status, perPage, page])

  // single delete
  async function handleDeleteMember(id: number | string) {
    if (!confirm('Delete this member? This cannot be undone.')) return
    try {
      await deleteMember(id)
      setMembers(prev => prev.filter(m => String(m.id) !== String(id)))
      setToast({ show: true, message: 'Member deleted', type: 'success' })
      // remove from selection if present
      setSelected(prev => {
        const copy = { ...prev }; delete copy[String(id)]; return copy
      })
    } catch (err: any) {
      console.error('delete member failed', err)
      setToast({ show: true, message: err?.message ?? 'Delete failed', type: 'error' })
    }
  }

  // bulk delete
  async function handleBulkDelete() {
    const ids = Object.keys(selected).filter(k => selected[k])
    if (ids.length === 0) { setToast({ show: true, type: 'error', message: 'No members selected' }); return }
    if (!confirm(`Delete ${ids.length} members? This cannot be undone.`)) return
    try {
      for (const id of ids) {
        await deleteMember(id)
      }
      setMembers(prev => prev.filter(m => !ids.includes(String(m.id))))
      setSelected({})
      setToast({ show: true, message: `Deleted ${ids.length} members`, type: 'success' })
    } catch (err: any) {
      console.error('bulk delete failed', err)
      setToast({ show: true, message: err?.message ?? 'Bulk delete failed', type: 'error' })
    }
  }

  // open inspect modal -> lazy load member data + some related resources
  async function openInspect(id: number | string) {
    setInspectingMemberId(id)
    setInspectingMember(null)
    setInspectingLoading(true)

    // block background scroll while loading UI is visible
    document.body.style.overflow = 'hidden'

    try {
      const body = await apiGet(`/api/admin/members/${id}`)
      const data = body?.data ?? body
      // try to fetch some related short lists (payments, events) if available
      let recentPayments: any[] = []
      try {
        const rp = await apiGet(`/api/admin/members/${id}/payments?limit=6`)
        recentPayments = Array.isArray(rp) ? rp : (rp?.data ?? [])
      } catch (e) { /* ignore */ }

      setInspectingMember({ ...data, recentPayments })
      // focus the close button once data is loaded
      setTimeout(() => closeBtnRef.current?.focus(), 50)
    } catch (err: any) {
      console.error('fetch member failed', err)
      setToast({ show: true, message: err?.message ?? 'Failed to load member', type: 'error' })
      setInspectingMember(null)
      setInspectingMemberId(null)
      // restore scroll if closed on error
      document.body.style.overflow = ''
    } finally {
      setInspectingLoading(false)
    }
  }

  // close modal helper
  function closeInspect() {
    setInspectingMemberId(null)
    setInspectingMember(null)
    setInspectingLoading(false)
    document.body.style.overflow = ''
  }

  // toggle active (works both from row and modal)
  async function toggleActive(member: Member) {
    if (!member?.id) return
    const newVal = !member.is_active
    try {
      await fetch(`/api/admin/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newVal }),
        credentials: 'same-origin',
      })
      // refresh row in UI
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, is_active: newVal } : m))
      if (inspectingMember?.id === member.id) setInspectingMember(prev => prev ? { ...prev, is_active: newVal } : prev)
      setToast({ show: true, message: `Member ${newVal ? 'activated' : 'deactivated'}`, type: 'success' })
    } catch (err: any) {
      console.error('toggle active failed', err)
      setToast({ show: true, message: err?.message ?? 'Failed to update member', type: 'error' })
    }
  }

  // helpers for selection
  function toggleSelect(id: string | number) {
    setSelected(prev => ({ ...prev, [String(id)]: !prev[String(id)] }))
  }
  function selectAllCurrentlyShown() {
    const map: Record<string, boolean> = {}
    members.forEach(m => { map[String(m.id)] = true })
    setSelected(map)
  }
  function clearSelection() { setSelected({}) }

  // export URL
  const exportUrl = useMemo(() => {
    const qs = new URLSearchParams()
    if (churchId) qs.set('church_id', String(churchId))
    if (status && status !== 'all') qs.set('is_active', status === 'active' ? '1' : '0')
    if (debouncedQ) qs.set('q', debouncedQ)
    return `/api/admin/members/export${qs.toString() ? `?${qs.toString()}` : ''}`
  }, [churchId, status, debouncedQ])

  // keyboard / click handlers while modal open
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!inspectingMemberId) return
      if (e.key === 'Escape') {
        e.preventDefault()
        closeInspect()
      } else if (e.key === 'Tab') {
        // basic focus trap: keep focus inside modal
        const container = modalRef.current
        if (!container) return
        const focusable = container.querySelectorAll<HTMLElement>('a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])')
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === last) {
            first.focus()
            e.preventDefault()
          }
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [inspectingMemberId])

  // close on overlay click
  function onOverlayMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) {
      closeInspect()
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <div className="text-sm text-gray-500">Manage all members — search, filter, export or bulk-manage</div>
        </div>

        <div className="flex gap-2 items-center">
          <Link href="/admin/members/new" className="px-3 py-2 bg-sky-600 text-white rounded">Add member</Link>
          <a href={exportUrl} className="px-3 py-2 border rounded text-sm">Export CSV</a>
        </div>
      </div>

      <div className="bg-white rounded shadow p-4 mb-4">
        <div className="flex gap-2 flex-wrap">
          <input
            placeholder="Search name, phone, email or number…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="p-2 border rounded w-80"
          />

          <select value={churchId} onChange={(e) => { setChurchId(e.target.value); setPage(1) }} className="p-2 border rounded">
            <option value="">All churches</option>
            {churches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select value={status} onChange={(e) => { setStatus(e.target.value as any); setPage(1) }} className="p-2 border rounded">
            <option value="all">Any status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select value={String(perPage)} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }} className="p-2 border rounded">
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
          </select>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={selectAllCurrentlyShown} className="px-3 py-1 border rounded text-sm">Select all</button>
            <button onClick={clearSelection} className="px-3 py-1 border rounded text-sm">Clear</button>
            <button onClick={handleBulkDelete} disabled={selectedCount === 0} className="px-3 py-1 bg-red-50 text-red-600 border rounded text-sm disabled:opacity-50">
              Delete ({selectedCount})
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-gray-500">
            <tr>
              <th className="p-2"><input type="checkbox" onChange={(e) => { e.target.checked ? selectAllCurrentlyShown() : clearSelection() }} checked={members.length > 0 && selectedCount === members.length} /></th>
              <th className="p-3">#</th>
              <th className="p-3">Name</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Church</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-4">Loading…</td></tr>
            ) : members.length === 0 ? (
              <tr><td colSpan={7} className="p-4 text-gray-500">No members found</td></tr>
            ) : members.map(m => (
              <tr key={m.id} className="border-t last:border-b">
                <td className="p-2">
                  <input type="checkbox" checked={!!selected[String(m.id)]} onChange={() => toggleSelect(m.id)} />
                </td>
                <td className="p-3">{m.member_number ?? m.id}</td>
                <td className="p-3">
                  <div className="font-medium">{m.first_name} {m.last_name}</div>
                  <div className="text-xs text-gray-500">{m.email ?? ''}</div>
                </td>
                <td className="p-3">{m.phone ?? '—'}</td>
                <td className="p-3">{m.church?.name ?? '—'}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs ${m.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'}`}>{m.is_active ? 'Active' : 'Inactive'}</span>
                </td>
                <td className="p-3">
                  <div className="flex gap-2 items-center">
                    <Link href={`/admin/members/${m.id}`} className="text-sky-600 text-sm">View</Link>
                    <Link href={`/admin/members/${m.id}/edit`} className="text-gray-700 text-sm">Edit</Link>
                    <button onClick={() => toggleActive(m)} className="text-sm">{m.is_active ? 'Deactivate' : 'Activate'}</button>
                    <button onClick={() => handleDeleteMember(m.id)} className="text-red-600 text-sm">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-gray-500">Showing {members.length} members{total !== null ? ` — ${total} total` : ''}</div>
        <div className="flex gap-2 items-center">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 border rounded text-sm">Prev</button>
          <div className="px-3 py-1 border rounded text-sm">Page {page}{lastPage ? ` / ${lastPage}` : ''}</div>
          <button onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded text-sm">Next</button>
        </div>
      </div>

      {/* Inspect modal */}
      {inspectingMemberId && (
        <div
          ref={overlayRef}
          onMouseDown={onOverlayMouseDown}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          aria-modal="true"
          role="dialog"
        >
          <div ref={modalRef} className="bg-white rounded-lg shadow-lg max-w-2xl w-full overflow-auto">
            <div className="flex items-start justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold">Member details</h3>
                <div className="text-xs text-gray-500">{inspectingMember?.member_number ?? inspectingMemberId}</div>
              </div>
              <div>
                <button
                  ref={closeBtnRef}
                  onClick={closeInspect}
                  className="px-2 py-1 border rounded"
                  aria-label="Close member details"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-4">
              {inspectingLoading ? (
                <div>Loading…</div>
              ) : !inspectingMember ? (
                <div className="text-sm text-gray-500">No details</div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500">Name</div>
                      <div className="font-medium">{inspectingMember.first_name} {inspectingMember.last_name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Phone / Email</div>
                      <div className="font-medium">{inspectingMember.phone ?? '—'} {inspectingMember.email ? <span className="text-xs text-gray-500"> • {inspectingMember.email}</span> : null}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Church</div>
                      <div className="font-medium">{inspectingMember.church?.name ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Status</div>
                      <div className="font-medium">{inspectingMember.is_active ? 'Active' : 'Inactive'}</div>
                    </div>
                  </div>

                  {Array.isArray(inspectingMember.recentPayments) && inspectingMember.recentPayments.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-500">Recent payments</div>
                      <ul className="mt-2 space-y-1">
                        {inspectingMember.recentPayments.map((p: any) => (
                          <li key={p.id} className="flex items-center justify-between text-sm">
                            <div>{p.type ?? 'Payment'} — {p.reference ?? `#${p.id}`}</div>
                            <div className="text-xs text-gray-500">{p.amount} {p.currency ?? ''}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <div className="text-xs text-gray-500">Raw</div>
                    <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto">{JSON.stringify(inspectingMember, null, 2)}</pre>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/members/${inspectingMemberId}/edit`} className="px-3 py-1 border rounded text-sm">Edit</Link>
                    <button onClick={() => toggleActive(inspectingMember)} className="px-3 py-1 border rounded text-sm">{inspectingMember.is_active ? 'Deactivate' : 'Activate'}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
