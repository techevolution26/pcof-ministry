// src/components/MemberTypeahead.tsx
'use client'
import React, { useEffect, useRef, useState } from 'react'
import { searchMembersByQuery } from '@/lib/adminApi' // implement searchMembersByQuery in adminApi

type Member = { id: number; first_name?: string; last_name?: string; member_number?: string; email?: string }
type Props = {
    value?: number | string | null
    onSelect: (member: Member | null) => void
    placeholder?: string
    required?: boolean
    className?: string
}

/**
 * Simple typeahead — IMPORTANT: does NOT render a <form>.
 * Use only as a child inside other forms (MinisterForm etc).
 */
export default function MemberTypeahead({
    value,
    onSelect,
    placeholder = 'Type a member name or email…',
    required = false,
    className = '',
}: Props) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<Member[]>([])
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selected, setSelected] = useState<Member | null>(null)
    const timerRef = useRef<number | null>(null)
    const rootRef = useRef<HTMLDivElement | null>(null)

    // If parent passes an id as `value`, you may want to fetch that member and set the label.
    // Add `fetchMemberById` in adminApi if you want to show label when editing.
    useEffect(() => {
        if (!value) { setSelected(null); setQuery(''); return }
        // optional: fetch and set selected member by id
    }, [value])

    useEffect(() => {
        function onDoc(e: MouseEvent) {
            if (!rootRef.current) return
            if (!(e.target instanceof Node) || !rootRef.current.contains(e.target)) {
                setOpen(false)
            }
        }
        document.addEventListener('click', onDoc)
        return () => document.removeEventListener('click', onDoc)
    }, [])

    async function doSearch(q: string) {
        if (!q || q.trim().length < 1) {
            setResults([])
            setOpen(false)
            return
        }
        setLoading(true)
        try {
            // Implement `searchMembersByQuery(q, limit)` in adminApi to return array
            const r = await searchMembersByQuery(q.trim(), 10)
            setResults(Array.isArray(r) ? r : (r?.data ?? []))
            setOpen(true)
        } catch (err) {
            console.error('member search failed', err)
            setResults([])
            setOpen(false)
        } finally {
            setLoading(false)
        }
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const v = e.target.value
        setQuery(v)
        if (timerRef.current) window.clearTimeout(timerRef.current)
        timerRef.current = window.setTimeout(() => doSearch(v), 250)
    }

    function handleSelect(m: Member) {
        setSelected(m)
        setQuery(`${m.first_name ?? ''} ${m.last_name ?? ''}`.trim() || m.member_number || m.email || String(m.id))
        setOpen(false)
        onSelect(m)
    }

    function clearSelection() {
        setSelected(null)
        setQuery('')
        setResults([])
        onSelect(null)
    }

    return (
        <div ref={rootRef} className={`relative ${className}`}>
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={query}
                    onChange={handleChange}
                    onFocus={() => { if (results.length) setOpen(true) }}
                    placeholder={placeholder}
                    required={required && !selected}
                    className="w-full p-2 border rounded"
                    aria-autocomplete="list"
                />
                {selected && (
                    <button type="button" onClick={clearSelection} className="text-sm text-red-600">
                        Clear
                    </button>
                )}
            </div>

            {open && (
                <div className="absolute z-50 mt-1 w-full bg-white border rounded shadow max-h-64 overflow-auto">
                    {loading && <div className="p-2 text-sm text-gray-500">Searching…</div>}
                    {!loading && results.length === 0 && <div className="p-2 text-sm text-gray-500">No results</div>}
                    {!loading && results.map((m) => (
                        <button
                            key={m.id}
                            type="button"                      // <- important: NOT a submit button
                            onClick={() => handleSelect(m)}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50"
                        >
                            <div className="text-sm font-medium">
                                {m.first_name ?? ''} {m.last_name ?? ''} {m.member_number ? <span className="text-xs text-gray-400"> — {m.member_number}</span> : null}
                            </div>
                            <div className="text-xs text-gray-500">{m.email ?? ''}</div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
