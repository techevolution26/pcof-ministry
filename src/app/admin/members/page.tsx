'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { apiGet, deleteMember } from '@/lib/adminApi'
import { fetchChurchesList } from '@/lib/adminApi'
import Toast from '@/components/Toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUsers, 
  faSearch, 
  faPlus, 
  faEye, 
  faEdit, 
  faTrash, 
  faChurch,
  faDownload,
  faToggleOn,
  faToggleOff,
  faSpinner,
  faFilter,
  faCheckSquare,
  faSquare,
  faArrowLeft,
  faArrowRight,
  faTimes,
  faMoneyBillWave,
  faUserCheck,
  faUserSlash
} from '@fortawesome/free-solid-svg-icons'

type Member = unknown

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

  // pagination meta
  const [total, setTotal] = useState<number | null>(null)
  const [lastPage, setLastPage] = useState<number | null>(null)

  // bulk select
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const selectedCount = useMemo(() => Object.values(selected).filter(Boolean).length, [selected])

  // UI extras
  const [churches, setChurches] = useState<unknown[]>([])
  const [toast, setToast] = useState<unknown | null>(null)
  const searchTimer = useRef<number | null>(null)

  // member inspect modal
  const [inspectingMemberId, setInspectingMemberId] = useState<number | string | null>(null)
  const [inspectingMember, setInspectingMember] = useState<Member | null>(null)
  const [inspectingLoading, setInspectingLoading] = useState(false)

  // refs for modal behaviour
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const modalRef = useRef<HTMLDivElement | null>(null)
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)

  // load churches for filter dropdown
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
        const list = Array.isArray(body) ? body : (body?.data ?? [])
        if (!mounted) return
        setMembers(list)
        const meta = body?.meta ?? body?.pagination ?? null
        setTotal(meta?.total ?? null)
        setLastPage(meta?.last_page ?? meta?.lastPage ?? null)
        setError(null)
      } catch (err: unknown) {
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
    if (!confirm('Are you sure you want to delete this member? This action cannot be undone.')) return
    try {
      await deleteMember(id)
      setMembers(prev => prev.filter(m => String(m.id) !== String(id)))
      setToast({ show: true, message: 'Member deleted successfully', type: 'success' })
      setSelected(prev => {
        const copy = { ...prev }; delete copy[String(id)]; return copy
      })
    } catch (err: unknown) {
      console.error('delete member failed', err)
      setToast({ show: true, message: err?.message ?? 'Delete failed', type: 'error' })
    }
  }

  // bulk delete
  async function handleBulkDelete() {
    const ids = Object.keys(selected).filter(k => selected[k])
    if (ids.length === 0) { setToast({ show: true, type: 'error', message: 'No members selected' }); return }
    if (!confirm(`Are you sure you want to delete ${ids.length} members? This action cannot be undone.`)) return
    try {
      for (const id of ids) {
        await deleteMember(id)
      }
      setMembers(prev => prev.filter(m => !ids.includes(String(m.id))))
      setSelected({})
      setToast({ show: true, message: `Successfully deleted ${ids.length} members`, type: 'success' })
    } catch (err: unknown) {
      console.error('bulk delete failed', err)
      setToast({ show: true, message: err?.message ?? 'Bulk delete failed', type: 'error' })
    }
  }

  // open inspect modal
  async function openInspect(id: number | string) {
    setInspectingMemberId(id)
    setInspectingMember(null)
    setInspectingLoading(true)

    document.body.style.overflow = 'hidden'

    try {
      const body = await apiGet(`/api/admin/members/${id}`)
      const data = body?.data ?? body
      let recentPayments: unknown[] = []
      try {
        const rp = await apiGet(`/api/admin/members/${id}/payments?limit=6`)
        recentPayments = Array.isArray(rp) ? rp : (rp?.data ?? [])
      } catch (e) { /* ignore */ }

      setInspectingMember({ ...data, recentPayments })
      setTimeout(() => closeBtnRef.current?.focus(), 50)
    } catch (err: unknown) {
      console.error('fetch member failed', err)
      setToast({ show: true, message: err?.message ?? 'Failed to load member details', type: 'error' })
      setInspectingMember(null)
      setInspectingMemberId(null)
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

  // toggle active
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
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, is_active: newVal } : m))
      if (inspectingMember?.id === member.id) setInspectingMember(prev => prev ? { ...prev, is_active: newVal } : prev)
      setToast({ show: true, message: `Member ${newVal ? 'activated' : 'deactivated'} successfully`, type: 'success' })
    } catch (err: unknown) {
      console.error('toggle active failed', err)
      setToast({ show: true, message: err?.message ?? 'Failed to update member status', type: 'error' })
    }
  }

  // selection helpers
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

  // keyboard handlers for modal
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!inspectingMemberId) return
      if (e.key === 'Escape') {
        e.preventDefault()
        closeInspect()
      } else if (e.key === 'Tab') {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
              Members Management
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Manage all members across your organization with advanced search and filtering
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a 
              href={exportUrl} 
              className="px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 font-semibold"
            >
              <FontAwesomeIcon icon={faDownload} className="text-sm" />
              Export CSV
            </a>
            <Link 
              href="/admin/members/new" 
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 font-semibold"
            >
              <FontAwesomeIcon icon={faPlus} className="text-sm" />
              Add Member
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
                  placeholder="Search by name, phone, email, or member number…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  aria-label="Search members"
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
              <FontAwesomeIcon icon={faFilter} className="text-gray-400 text-sm" />
              <select 
                value={churchId} 
                onChange={(e) => { setChurchId(e.target.value); setPage(1) }} 
                className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All churches</option>
                {churches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <select 
                value={status} 
                onChange={(e) => { setStatus(e.target.value as unknown); setPage(1) }} 
                className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Any status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <select 
                value={String(perPage)} 
                onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }} 
                className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="10">10 / page</option>
                <option value="20">20 / page</option>
                <option value="50">50 / page</option>
                <option value="100">100 / page</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedCount > 0 && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={faUsers} className="text-blue-500 text-lg" />
                  <div>
                    <div className="font-semibold text-blue-800 dark:text-blue-300">
                      {selectedCount} member{selectedCount !== 1 ? 's' : ''} selected
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      Bulk actions available for selected members
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={selectAllCurrentlyShown} 
                    className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faCheckSquare} className="text-sm" />
                    Select All
                  </button>
                  <button 
                    onClick={clearSelection} 
                    className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faTimes} className="text-sm" />
                    Clear
                  </button>
                  <button 
                    onClick={handleBulkDelete} 
                    disabled={selectedCount === 0}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-semibold"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-sm" />
                    Delete ({selectedCount})
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 overflow-hidden">
          <div className="overflow-auto">
            <table className="w-full text-left text-sm min-w-[1000px]">
              <thead className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                <tr>
                  <th className="p-6">
                    <input 
                      type="checkbox" 
                      onChange={(e) => { e.target.checked ? selectAllCurrentlyShown() : clearSelection() }} 
                      checked={members.length > 0 && selectedCount === members.length}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="p-6 font-semibold text-gray-700 dark:text-gray-200 text-base">Member ID</th>
                  <th className="p-6 font-semibold text-gray-700 dark:text-gray-200 text-base">Member Details</th>
                  <th className="p-6 font-semibold text-gray-700 dark:text-gray-200 text-base">Contact</th>
                  <th className="p-6 font-semibold text-gray-700 dark:text-gray-200 text-base">Church</th>
                  <th className="p-6 font-semibold text-gray-700 dark:text-gray-200 text-base">Status</th>
                  <th className="p-6 font-semibold text-gray-700 dark:text-gray-200 text-base">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  Array.from({ length: perPage > 20 ? 10 : perPage }).map((_, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="p-6"><div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>
                      <td className="p-6"><div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
                          <div className="space-y-2">
                            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          </div>
                        </div>
                      </td>
                      <td className="p-6"><div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>
                      <td className="p-6"><div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>
                      <td className="p-6"><div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" /></td>
                      <td className="p-6"><div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" /></td>
                    </tr>
                  ))
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <FontAwesomeIcon icon={faUsers} className="text-gray-400 text-2xl" />
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                          No members found
                        </div>
                        {debouncedQ || churchId || status !== 'all' ? (
                          <p className="text-gray-400 dark:text-gray-500 max-w-md">
                            No members match your current filters. Try adjusting your search criteria or clear the filters.
                          </p>
                        ) : (
                          <p className="text-gray-400 dark:text-gray-500 max-w-md">
                            Get started by adding members to your organization.
                          </p>
                        )}
                        <Link 
                          href="/admin/members/new" 
                          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 font-semibold mt-4"
                        >
                          <FontAwesomeIcon icon={faPlus} className="text-sm" />
                          Add Your First Member
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : members.map(m => (
                  <tr key={m.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="p-6">
                      <input 
                        type="checkbox" 
                        checked={!!selected[String(m.id)]} 
                        onChange={() => toggleSelect(m.id)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="p-6">
                      <div className="font-mono text-sm text-gray-600 dark:text-gray-400">
                        {m.member_number ?? m.id}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg">
                            {(m.first_name?.charAt(0) + m.last_name?.charAt(0)).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white text-lg">
                            {m.first_name} {m.last_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {m.email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="text-gray-700 dark:text-gray-300">
                        {m.phone || '—'}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faChurch} className="text-gray-400 text-sm" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {m.church?.name || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        m.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                      }`}>
                        <FontAwesomeIcon 
                          icon={m.is_active ? faUserCheck : faUserSlash} 
                          className="mr-1 text-xs" 
                        />
                        {m.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openInspect(m.id)}
                          className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
                          title="Quick View"
                        >
                          <FontAwesomeIcon icon={faEye} className="text-sm" />
                        </button>
                        <Link
                          href={`/admin/members/${m.id}`}
                          className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg flex items-center justify-center hover:bg-green-200 dark:hover:bg-green-800/50 transition-colors"
                          title="Full Details"
                        >
                          <FontAwesomeIcon icon={faEye} className="text-sm" />
                        </Link>
                        <Link
                          href={`/admin/members/${m.id}/edit`}
                          className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-lg flex items-center justify-center hover:bg-yellow-200 dark:hover:bg-yellow-800/50 transition-colors"
                          title="Edit Member"
                        >
                          <FontAwesomeIcon icon={faEdit} className="text-sm" />
                        </Link>
                        <button
                          onClick={() => toggleActive(m)}
                          className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-colors"
                          title={m.is_active ? 'Deactivate' : 'Activate'}
                        >
                          <FontAwesomeIcon icon={m.is_active ? faToggleOn : faToggleOff} className="text-sm" />
                        </button>
                        <button
                          onClick={() => handleDeleteMember(m.id)}
                          className="w-10 h-10 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors"
                          title="Delete Member"
                        >
                          <FontAwesomeIcon icon={faTrash} className="text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing <strong className="text-gray-900 dark:text-white">{members.length}</strong> members
            {total !== null && (
              <span> of <strong className="text-gray-900 dark:text-white">{total}</strong> total</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))} 
              disabled={page <= 1}
              className="w-10 h-10 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="text-gray-600 dark:text-gray-400 text-sm" />
            </button>
            
            <div className="flex items-center gap-1 mx-2">
              <span className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Page {page}{lastPage ? ` of ${lastPage}` : ''}
              </span>
            </div>
            
            <button 
              onClick={() => setPage(p => p + 1)} 
              disabled={lastPage !== null && page >= lastPage}
              className="w-10 h-10 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FontAwesomeIcon icon={faArrowRight} className="text-gray-600 dark:text-gray-400 text-sm" />
            </button>
          </div>
        </div>

        {/* Enhanced Inspect Modal */}
        {inspectingMemberId && (
          <div
            ref={overlayRef}
            onMouseDown={onOverlayMouseDown}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            aria-modal="true"
            role="dialog"
          >
            <div ref={modalRef} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden transform transition-all duration-300 scale-95 hover:scale-100">
              <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Member Details</h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {inspectingMember?.member_number ?? inspectingMemberId}
                  </div>
                </div>
                <button
                  ref={closeBtnRef}
                  onClick={closeInspect}
                  className="w-10 h-10 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-gray-600 dark:text-gray-400"
                  aria-label="Close member details"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-lg" />
                </button>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {inspectingLoading ? (
                  <div className="flex items-center justify-center gap-3 py-12">
                    <FontAwesomeIcon icon={faSpinner} className="text-blue-500 text-xl animate-spin" />
                    <div className="text-gray-600 dark:text-gray-400 font-medium">Loading member details...</div>
                  </div>
                ) : !inspectingMember ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No member details available
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Full Name</div>
                        <div className="font-semibold text-gray-900 dark:text-white text-lg">
                          {inspectingMember.first_name} {inspectingMember.last_name}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Contact</div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {inspectingMember.phone || '—'}
                          {inspectingMember.email && (
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {inspectingMember.email}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Church</div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {inspectingMember.church?.name || '—'}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Status</div>
                        <div className="font-medium">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                            inspectingMember.is_active 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                          }`}>
                            {inspectingMember.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Recent Payments */}
                    {Array.isArray(inspectingMember.recentPayments) && inspectingMember.recentPayments.length > 0 && (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <div className="flex items-center gap-2 mb-4">
                          <FontAwesomeIcon icon={faMoneyBillWave} className="text-green-500 text-sm" />
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">Recent Payments</div>
                        </div>
                        <div className="space-y-2">
                          {inspectingMember.recentPayments.map((p: unknown) => (
                            <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white text-sm">
                                  {p.type ?? 'Payment'} — {p.reference ?? `#${p.id}`}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                                </div>
                              </div>
                              <div className="font-semibold text-green-600 dark:text-green-400">
                                {p.amount ?? '—'} {p.currency ?? ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 flex justify-end gap-3">
                      <Link
                        href={`/admin/members/${inspectingMemberId}/edit`}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 font-semibold"
                      >
                        <FontAwesomeIcon icon={faEdit} className="text-sm" />
                        Edit Member
                      </Link>
                      <button
                        onClick={() => inspectingMember && toggleActive(inspectingMember)}
                        className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 font-semibold"
                      >
                        <FontAwesomeIcon 
                          icon={inspectingMember?.is_active ? faToggleOn : faToggleOff} 
                          className="text-sm" 
                        />
                        {inspectingMember?.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {toast && <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </div>
  )
}