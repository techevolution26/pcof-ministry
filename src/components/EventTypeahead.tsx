'use client'
import React, { useEffect, useState } from 'react'
import { fetchEvents } from '@/lib/adminApi'

type Props = { churchId?: string|number; onSelect: (e: any) => void; value?: any; placeholder?: string }

export default function EventTypeahead({ churchId, onSelect, value, placeholder }: Props) {
  const [q, setQ] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!mounted) return
      setLoading(true)
      try {
        // fetch both national events and church events (if churchId provided)
        const res = await fetchEvents({ q, church_id: churchId ?? undefined, per_page: 10 })
        const list = Array.isArray(res) ? res : (res?.data ?? [])
        if (mounted) setSuggestions(list)
      } catch (err) {
        if (mounted) setSuggestions([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    const t = setTimeout(load, 200)
    return () => { mounted = false; clearTimeout(t) }
  }, [q, churchId])

  return (
    <div>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder={placeholder ?? 'Search events'} className="w-full p-2 border rounded" />
      <div className="mt-2 max-h-48 overflow-auto bg-white border rounded">
        {loading ? <div className="p-2 text-xs text-gray-500">Searching…</div> : suggestions.map(s => (
          <button key={s.id} onClick={() => onSelect(s)} className="w-full text-left p-2 hover:bg-slate-50">
            <div className="text-sm font-medium">{s.title}</div>
            <div className="text-xs text-gray-500">{s.scope ?? (s.church_id ? 'church' : 'national')} • {s.starts_at ? new Date(s.starts_at).toLocaleDateString() : '—'}</div>
          </button>
        ))}
        {!loading && suggestions.length === 0 && <div className="p-2 text-xs text-gray-500">No events</div>}
      </div>
      {value && <div className="mt-2 text-xs text-gray-600">Selected: {value.title ?? value.id}</div>}
    </div>
  )
}
