// components/ChurchesList.tsx
'use client'

import React, { useMemo, useState, useEffect } from 'react'
import ChurchCard from './ChurchCard'

type Church = {
  id: string
  name: string
  slug?: string
  address?: string
  pastor?: string
  phone?: string
  tags?: string[] // e.g. ["urban","youth"]
  serviceTimes?: string // free-form for now
  logoUrl?: string
  locationUrl?: string // google maps link
}

export default function ChurchesList({ initialChurches }: { initialChurches: Church[] }) {
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState('all')
  const [sort, setSort] = useState<'name' | 'recent'>('name')
  const [page, setPage] = useState(1)
  const perPage = 9

  // derive tags available from data
  const tags = useMemo(() => {
    const s = new Set<string>()
    initialChurches.forEach(c => (c.tags || []).forEach(t => s.add(t)))
    return ['all', ...Array.from(s)]
  }, [initialChurches])

  // basic client-side filter+search
  const filtered = useMemo(() => {
    let arr = initialChurches.slice()
    if (query.trim()) {
      const q = query.toLowerCase()
      arr = arr.filter(c =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.address || '').toLowerCase().includes(q) ||
        (c.pastor || '').toLowerCase().includes(q)
      )
    }
    if (tag !== 'all') {
      arr = arr.filter(c => (c.tags || []).includes(tag))
    }
    if (sort === 'name') {
      arr.sort((a,b) => (a.name || '').localeCompare(b.name || ''))
    }
    return arr
  }, [initialChurches, query, tag, sort])

  // pagination
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  useEffect(() => { if (page > totalPages) setPage(1) }, [totalPages])

  const pageItems = filtered.slice((page-1)*perPage, page*perPage)

  return (
    <div>
      {/* Controls */}
      <div className="mb-6 flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div className="flex gap-2 items-center">
          <label htmlFor="search" className="sr-only">Search churches</label>
          <input
            id="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            placeholder="Search by name, address or pastor"
            className="px-3 py-2 border rounded-md w-72"
          />

          <select
            value={tag}
            onChange={(e) => { setTag(e.target.value); setPage(1) }}
            className="px-3 py-2 border rounded-md"
            aria-label="Filter by tag"
          >
            {tags.map(t => <option key={t} value={t}>{t === 'all' ? 'All' : t}</option>)}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="px-3 py-2 border rounded-md"
            aria-label="Sort"
          >
            <option value="name">Sort: Name</option>
            <option value="recent">Sort: Recent</option>
          </select>
        </div>

        <div className="text-sm text-slate-600">
          {total} church{total !== 1 ? 'es' : ''} found
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pageItems.map(ch => <ChurchCard key={ch.id} church={ch} />)}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-center gap-2">
        <button
          className="px-3 py-1 border rounded disabled:opacity-50"
          onClick={() => setPage(p => Math.max(1, p-1))}
          disabled={page === 1}
        >Prev</button>

        <div className="px-3 py-1 border rounded">
          Page {page} / {totalPages}
        </div>

        <button
          className="px-3 py-1 border rounded disabled:opacity-50"
          onClick={() => setPage(p => Math.min(totalPages, p+1))}
          disabled={page === totalPages}
        >Next</button>
      </div>
    </div>
  )
}
