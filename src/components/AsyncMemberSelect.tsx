'use client'
import React, { useEffect, useRef, useState } from 'react'
import { searchMembersByQuery, fetchMemberById } from '@/lib/adminApi'

type Option = { id: number | string; first_name?: string; last_name?: string; phone?: string; email?: string }

type Props = {
    value?: number | string | null
    onChange: (id: number | string | null) => void
    churchId?: string | number | null
    placeholder?: string
    className?: string
    allowClear?: boolean
}

export default function AsyncMemberSelect({ value = null, onChange, churchId, placeholder = 'Search member...', className = '', allowClear = true }: Props) {
    const [input, setInput] = useState<string>('')
    const [options, setOptions] = useState<Option[]>([])
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selected, setSelected] = useState<Option | null>(null)
    const timer = useRef<number | null>(null)
    const wrapperRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        // load initial selected label if value present
        let mounted = true
        async function load() {
            if (!value) { setSelected(null); return }
            try {
                const body = await fetchMemberById(value as any)
                const data = body?.data ?? body
                if (!mounted) return
                setSelected({ id: data.id, first_name: data.first_name, last_name: data.last_name, phone: data.phone, email: data.email })
                setInput([data.first_name, data.last_name].filter(Boolean).join(' '))
            } catch {
                // ignore
            }
        }
        load()
        return () => { mounted = false }
    }, [value])

    useEffect(() => {
        function onDoc(e: MouseEvent) {
            if (!wrapperRef.current) return
            if (!wrapperRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('click', onDoc)
        return () => document.removeEventListener('click', onDoc)
    }, [])

    async function doSearch(q: string) {
        if (!q || q.trim().length < 2) {
            setOptions([])
            return
        }
        setLoading(true)
        try {
            const res = await searchMembersByQuery(q, 10) // uses adminApi.searchMembersByQuery which accepts q
            setOptions(Array.isArray(res) ? res : (res?.data ?? []))
        } catch (err) {
            setOptions([])
        } finally {
            setLoading(false)
        }
    }

    function onInput(e: React.ChangeEvent<HTMLInputElement>) {
        const v = e.target.value
        setInput(v)
        setOpen(true)
        if (timer.current) window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => {
            doSearch(v)
        }, 300)
    }

    function handleSelect(opt: Option) {
        setSelected(opt)
        setInput([opt.first_name, opt.last_name].filter(Boolean).join(' '))
        setOpen(false)
        onChange(opt.id)
    }

    function clearSelection(e?: React.MouseEvent) {
        e?.stopPropagation()
        setSelected(null)
        setInput('')
        onChange(null)
    }

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <input
                type="text"
                value={input}
                onChange={onInput}
                onFocus={() => setOpen(true)}
                placeholder={placeholder}
                className="w-full p-2 border rounded"
                aria-autocomplete="list"
            />

            {allowClear && selected && (
                <button onClick={clearSelection} type="button" className="absolute right-2 top-2 text-xs text-gray-500">
                    Clear
                </button>
            )}

            {open && (
                <div className="absolute z-50 left-0 right-0 bg-white border rounded mt-1 shadow max-h-60 overflow-auto">
                    {loading && <div className="p-2 text-sm text-gray-500">Searching…</div>}
                    {!loading && options.length === 0 && <div className="p-2 text-sm text-gray-500">No matches</div>}
                    {!loading && options.map((o: any) => (
                        <button
                            key={o.id}
                            type="button"
                            onClick={() => handleSelect(o)}
                            className="w-full text-left p-2 hover:bg-slate-50 border-b last:border-b-0"
                        >
                            <div className="font-medium">{(o.first_name ? `${o.first_name} ${o.last_name ?? ''}` : o.name) ?? `#${o.id}`}</div>
                            <div className="text-xs text-gray-500">{o.phone ?? o.email ?? ''}</div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
