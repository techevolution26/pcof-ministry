'use client'
import React, { useEffect, useState } from 'react'
import { searchMembers } from '@/lib/adminApi'

type Props = { churchId?: string | number; onSelect: (m: any) => void; value?: any }

export default function MemberTypeahead({ churchId, onSelect, value }: Props) {
    const [q, setQ] = useState('')
    const [list, setList] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        let mounted = true
        async function load() {
            if (!mounted) return
            setLoading(true)
            try {
                const res = await searchMembers(q, 10) // your backend supports q param
                if (mounted) setList(res)
            } catch (err) {
                if (mounted) setList([])
            } finally { if (mounted) setLoading(false) }
        }
        const t = setTimeout(load, 200)
        return () => { mounted = false; clearTimeout(t) }
    }, [q])

    return (
        <div>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search members by name or #..." className="w-full p-2 border rounded" />
            <div className="mt-2 max-h-48 overflow-auto bg-white border rounded">
                {loading ? <div className="p-2 text-xs text-gray-500">Searching…</div> : list.map(m => (
                    <button key={m.id} onClick={() => onSelect(m)} className="w-full text-left p-2 hover:bg-slate-50">
                        <div className="text-sm">{[m.first_name, m.last_name].filter(Boolean).join(' ')}</div>
                        <div className="text-xs text-gray-500">{m.member_number ?? m.id} • {m.phone ?? ''}</div>
                    </button>
                ))}
                {!loading && list.length === 0 && <div className="p-2 text-xs text-gray-500">No members</div>}
            </div>
            {value && <div className="mt-2 text-xs text-gray-600">Selected: {[value.first_name, value.last_name].filter(Boolean).join(' ')}</div>}
        </div>
    )
}
