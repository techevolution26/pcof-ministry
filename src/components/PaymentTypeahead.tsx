'use client'
import React, { useState, useEffect } from 'react'
import { fetchPayments } from '@/lib/adminApi'

type Props = { churchId?: string | number; onSelect: (p: any) => void; value?: any }

export default function PaymentTypeahead({ churchId, onSelect, value }: Props) {
    const [q, setQ] = useState('')
    const [suggestions, setSuggestions] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        let mounted = true
        async function load() {
            if (!churchId) return setSuggestions([])
            setLoading(true)
            try {
                const res = await fetchPayments({ church_id: churchId, q, per_page: 10 })
                const list = Array.isArray(res) ? res : (res?.data ?? [])
                if (mounted) setSuggestions(list)
            } catch (err) {
                if (mounted) setSuggestions([])
            } finally {
                if (mounted) setLoading(false)
            }
        }
        const t = setTimeout(load, 250)
        return () => { mounted = false; clearTimeout(t) }
    }, [churchId, q])

    return (
        <div>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search payments by ref/member" className="w-full p-2 border rounded" />
            <div className="mt-2 max-h-56 overflow-auto bg-white border rounded">
                {loading ? <div className="p-2 text-sm text-gray-500">Searching…</div> : suggestions.map(s => (
                    <button key={s.id} onClick={() => onSelect(s)} className="w-full text-left p-2 hover:bg-slate-50">
                        <div className="text-sm font-medium">{s.reference ?? `#${s.id}`}</div>
                        <div className="text-xs text-gray-500">{s.type} • {s.amount} {s.currency ?? ''}</div>
                    </button>
                ))}
                {!loading && suggestions.length === 0 && <div className="p-2 text-xs text-gray-500">No payments</div>}
            </div>
            {value && <div className="mt-2 text-xs text-gray-600">Selected: {value.reference ?? value.id} • {value.amount}</div>}
        </div>
    )
}
