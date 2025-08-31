// components/ChurchesList.tsx
'use client'

import React, { useMemo, useState, useEffect } from 'react'
import ChurchCard from './ChurchCard'

type Church = {
  id: string
  name: string
  slug?: string
  branch?: string
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
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [sort, setSort] = useState<'name' | 'recent' | 'branch'>('name')
  const [page, setPage] = useState(1)
  const perPage = 9

  // derive tags available from data
  const tags = useMemo(() => {
    const s = new Set<string>()
    initialChurches.forEach(c => (c.tags || []).forEach(t => s.add(t)))
    return ['all', ...Array.from(s)]
  }, [initialChurches])

  // derive branches available from data
  const branches = useMemo(() => {
    const s = new Set<string>()
    initialChurches.forEach(c => {
      if (c.branch) s.add(c.branch)
    })
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

    if (selectedBranch !== 'all') {
      arr = arr.filter(c => (c.branch || '') === selectedBranch)
    }

    if (sort === 'name') {
      arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    } else if (sort === 'branch') {
      // sort by branch, fall back to name for ties
      arr.sort((a, b) => {
        const byBranch = (a.branch || '').localeCompare(b.branch || '')
        return byBranch !== 0 ? byBranch : (a.name || '').localeCompare(b.name || '')
      })
    }
    // 'recent' keeps original order (assumes initialChurches is already in recent order)
    return arr
  }, [initialChurches, query, tag, selectedBranch, sort])

  // pagination
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  useEffect(() => { if (page > totalPages) setPage(1) }, [totalPages])

  const pageItems = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <div>
      {/* Controls */}
      <div className="mb-8 p-6 bg-white rounded-2xl shadow-md border border-green-100">
        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            <label htmlFor="search" className="sr-only">Search churches</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
              <input
                id="search"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1) }}
                placeholder="Search by name, address or pastor"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-72 focus:ring-2 focus:ring-sky-300 focus:border-sky-300"
              />
            </div>

            <select
              value={selectedBranch}
              onChange={(e) => { setSelectedBranch(e.target.value); setPage(1) }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-300 focus:border-sky-300"
              aria-label="Filter by branch"
            >
              {branches.map(b => <option key={b} value={b}>{b === 'all' ? 'All branches' : b}</option>)}
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as 'name' | 'recent' | 'branch')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-300 focus:border-sky-300"
              aria-label="Sort"
            >
              <option value="name">Sort: Name</option>
              <option value="recent">Sort: Recent</option>
              <option value="branch">Sort: Branch</option>
            </select>
          </div>

          <div className="text-sm text-slate-600 bg-green-50 px-3 py-2 rounded-lg">
            {total} church{total !== 1 ? 'es' : ''} found
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {pageItems.map(ch => <ChurchCard key={ch.id} church={ch} />)}
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
    </div>
  )
}