'use client'
import React, { useEffect, useRef, useState } from 'react'
import { fetchPublicChurches } from '@/lib/adminApi'

type Props = {
    value?: string | number | ''
    onSelect: (church: any | null) => void
    placeholder?: string
}

export default function ChurchTypeahead({ value, onSelect, placeholder }: Props) {
    const [q, setQ] = useState('')
    const [items, setItems] = useState<any[]>([])
    const [open, setOpen] = useState(false)
    const timer = useRef<number | null>(null)

    useEffect(() => {
        // prefill if value (id) present: load single
        if (!value) return
        let mounted = true
            ; (async () => {
                try {
                    const c = await fetchPublicChurches({ limit: 1 })
                    if (!mounted) return
                    // we didn't supply id-based fetch here; caller can load selected church separately if needed
                } catch (err) { /* ignore */ }
            })()
        return () => { mounted = false }
    }, [value])

    async function doSearch(qs: string) {
        try {
            const resp = await fetchPublicChurches({ q: qs, limit: 10 })
            setItems(resp)
            setOpen(true)
        } catch (err) {
            setItems([])
            setOpen(false)
        }
    }

    function onInput(e: React.ChangeEvent<HTMLInputElement>) {
        const v = e.target.value
        setQ(v)
        if (timer.current) window.clearTimeout(timer.current)
        // debounce
        timer.current = window.setTimeout(() => {
            if (v.trim().length === 0) {
                setItems([])
                setOpen(false)
                return
            }
            doSearch(v.trim())
        }, 250)
    }

    function doSelect(item: any) {
        setQ(item.name)
        setOpen(false)
        onSelect(item)
    }

    return (
        <div className="relative">
            <input
                type="text"
                value={q}
                onChange={onInput}
                onFocus={() => q && doSearch(q)}
                placeholder={placeholder ?? 'Search churches...'}
                className="w-full p-2 border rounded"
                aria-autocomplete="list"
            />
            {open && items.length > 0 && (
                <ul className="absolute z-50 left-0 right-0 bg-white border rounded mt-1 max-h-56 overflow-auto">
                    {items.map(i => (
                        <li key={i.id} className="p-2 hover:bg-slate-50 cursor-pointer" onClick={() => doSelect(i)}>
                            <div className="font-medium">{i.name}</div>
                            {i.branch && <div className="text-xs text-gray-500">{i.branch}</div>}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
