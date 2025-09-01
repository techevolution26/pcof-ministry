// src/components/EventsList.tsx
'use client'

import React, { useMemo, useState, useEffect } from 'react'
import EventCard from './EventCard'
import Link from 'next/link'
import type { EventItem } from '@/types'

export default function EventsList({ initialEvents }: { initialEvents?: EventItem[] }) {
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState('all')
  const [upcomingOnly, setUpcomingOnly] = useState(true)
  const [page, setPage] = useState(1)
  const perPage = 9

  // defensively ensure initialEvents is an array
  const eventsArr = Array.isArray(initialEvents) ? initialEvents : []

  // collect tag list (defensive)
  const tags = useMemo(() => {
    const s = new Set<string>()
    for (const e of eventsArr) {
      if (Array.isArray(e.tags)) {
        for (const t of e.tags) {
          if (typeof t === 'string' && t.trim()) s.add(t)
        }
      }
    }
    return ['all', ...Array.from(s)]
  }, [initialEvents])

  const filtered = useMemo(() => {
    const now = Date.now()
    let arr = eventsArr.slice()

    if (query.trim()) {
      const q = query.toLowerCase()
      arr = arr.filter(e =>
        (e.title ?? '').toLowerCase().includes(q) ||
        (e.host ?? '').toLowerCase().includes(q) ||
        (e.description ?? '').toLowerCase().includes(q)
      )
    }

    if (tag !== 'all') {
      arr = arr.filter(e => Array.isArray(e.tags) && e.tags.includes(tag))
    }

    if (upcomingOnly) {
      arr = arr.filter(e => {
        if (!e.startsAt) return true // keep undated events
        const t = Date.parse(String(e.startsAt))
        return !isNaN(t) && t >= now
      })
    }

    arr.sort((a, b) => {
      const A = a.startsAt ? Date.parse(String(a.startsAt)) : 0
      const B = b.startsAt ? Date.parse(String(b.startsAt)) : 0
      return A - B
    })

    return arr
  }, [initialEvents, query, tag, upcomingOnly])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  useEffect(() => { if (page > totalPages) setPage(1) }, [totalPages])

  const pageItems = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <div>
      {/* Controls */}
      <div className="mb-8 p-6 bg-white rounded-2xl shadow-md border border-green-100">
        <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            <label htmlFor="events-search" className="sr-only">Search events</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
              <input
                id="events-search"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-80 focus:ring-2 focus:ring-sky-300 focus:border-sky-300"
                placeholder="Search events or programs"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1) }}
              />
            </div>

            <select
              value={tag}
              onChange={e => { setTag(e.target.value); setPage(1) }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-300 focus:border-sky-300"
            >
              {tags.map(t => <option key={t} value={t}>{t === 'all' ? 'All tags' : t}</option>)}
            </select>

            <label className="inline-flex items-center gap-2 text-sm bg-green-50 px-3 py-2 rounded-lg">
              <input
                type="checkbox"
                checked={upcomingOnly}
                onChange={e => setUpcomingOnly(e.target.checked)}
                className="rounded focus:ring-sky-300"
              />
              Upcoming only
            </label>
          </div>

          <div className="text-sm text-slate-600 bg-green-50 px-3 py-2 rounded-lg">
            {total} event{total !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pageItems.map(e => (
          // `e` is `EventItem` so it matches EventCard's expected prop type
          <EventCard key={e.id} event={e} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-1 disabled:opacity-50 hover:bg-green-50 transition-colors"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <span>⬅️</span> Prev
          </button>
          <div className="px-4 py-2 border border-gray-300 rounded-lg bg-white">
            Page {page} of {totalPages}
          </div>
          <button
            className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-1 disabled:opacity-50 hover:bg-green-50 transition-colors"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next <span>➡️</span>
          </button>
        </div>
      )}

      <div className="mt-8 text-sm text-center p-4 bg-white rounded-2xl shadow-md border border-green-100">
        <Link href="/admin/events" className="text-sky-600 hover:text-sky-700 underline">
          Admins: manage events
        </Link>
      </div>
    </div>
  )
}
