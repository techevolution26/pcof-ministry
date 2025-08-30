// src/components/EventsList.tsx
'use client'

import React, { useMemo, useState, useEffect } from 'react'
import EventCard from './EventCard'
import Link from 'next/link'

type Event = {
  id: string
  title: string
  startsAt?: string | null
  endsAt?: string | null
  location?: string
  locationUrl?: string
  host?: string
  tags?: string[] | null
  online?: boolean
  capacity?: number
  description?: string
}

export default function EventsList({ initialEvents }: { initialEvents?: Event[] }) {
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState('all')
  const [upcomingOnly, setUpcomingOnly] = useState(true)
  const [page, setPage] = useState(1)
  const perPage = 9

  // defensively ensure initialEvents is an array
  const eventsArr = Array.isArray(initialEvents) ? initialEvents : []

  // collect tag list (defensive)
  const tags = useMemo(() => {
    const s = new Set<string>() // <-- no generic in constructor at runtime; safe
    for (const e of eventsArr) {
      if (Array.isArray(e.tags)) {
        for (const t of e.tags) {
          if (t) s.add(String(t))
        }
      }
    }
    return ['all', ...Array.from(s)]
  }, [initialEvents]) // keep dependency as original prop

  const filtered = useMemo(() => {
    const now = Date.now()
    let arr = eventsArr.slice()
    if (query.trim()) {
      const q = query.toLowerCase()
      arr = arr.filter(e =>
        (e.title || '').toLowerCase().includes(q) ||
        (e.host || '').toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q)
      )
    }
    if (tag !== 'all') arr = arr.filter(e => Array.isArray(e.tags) && e.tags.includes(tag))
    if (upcomingOnly) arr = arr.filter(e => !e.startsAt || new Date(e.startsAt).getTime() >= now)
    arr.sort((a,b) => {
      const A = a.startsAt ? new Date(a.startsAt).getTime() : 0
      const B = b.startsAt ? new Date(b.startsAt).getTime() : 0
      return A - B
    })
    return arr
  }, [initialEvents, query, tag, upcomingOnly])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  useEffect(() => { if (page > totalPages) setPage(1) }, [totalPages])

  const pageItems = filtered.slice((page-1)*perPage, page*perPage)

  return (
    <div>
      {/* Controls */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <label htmlFor="events-search" className="sr-only">Search events</label>
          <input
            id="events-search"
            className="px-3 py-2 border rounded-md w-80"
            placeholder="Search events or programs"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
          />

          <select
            value={tag}
            onChange={e => { setTag(e.target.value); setPage(1) }}
            className="px-3 py-2 border rounded-md"
          >
            {tags.map(t => <option key={t} value={t}>{t === 'all' ? 'All tags' : t}</option>)}
          </select>

          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={upcomingOnly} onChange={e => setUpcomingOnly(e.target.checked)} />
            Upcoming only
          </label>
        </div>

        <div className="text-sm text-slate-600">
          {total} event{total !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pageItems.map(e => <EventCard key={e.id} event={e} />)}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-center gap-2">
        <button className="px-3 py-1 border rounded disabled:opacity-50" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>Prev</button>
        <div className="px-3 py-1 border rounded">Page {page} / {totalPages}</div>
        <button className="px-3 py-1 border rounded disabled:opacity-50" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}>Next</button>
      </div>

      <div className="mt-6 text-sm">
        <Link href="/admin/events" className="underline">Admins: manage events</Link>
      </div>
    </div>
  )
}
