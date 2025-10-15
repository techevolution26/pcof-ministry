'use client'
import React, { useEffect, useRef, useState } from 'react'
import { searchMembersByQuery, fetchMemberById } from '@/lib/adminApi'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faSpinner, faTimes } from '@fortawesome/free-solid-svg-icons'

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
            const res = await searchMembersByQuery(q, 10)
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
        setOpen(false)
    }

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <div className="relative">
                <FontAwesomeIcon
                    icon={faSearch}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"
                />
                <input
                    type="text"
                    value={input}
                    onChange={onInput}
                    onFocus={() => setOpen(true)}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-10 py-3 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    aria-autocomplete="list"
                />

                {allowClear && selected && (
                    <button
                        onClick={clearSelection}
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        <FontAwesomeIcon icon={faTimes} className="text-sm" />
                    </button>
                )}
            </div>

            {open && (
                <div className="absolute z-50 left-0 right-0 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl mt-1 shadow-lg max-h-60 overflow-auto">
                    {loading && (
                        <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                            <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                            Searching...
                        </div>
                    )}
                    {!loading && options.length === 0 && input.length >= 2 && (
                        <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                            No members found
                        </div>
                    )}
                    {!loading && input.length < 2 && (
                        <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                            Type at least 2 characters to search
                        </div>
                    )}
                    {!loading && options.map((o: any) => (
                        <button
                            key={o.id}
                            type="button"
                            onClick={() => handleSelect(o)}
                            className="w-full text-left p-3 hover:bg-blue-50 dark:hover:bg-gray-600 border-b border-gray-100 dark:border-gray-600 last:border-b-0 transition-colors duration-200"
                        >
                            <div className="font-medium text-gray-900 dark:text-white">
                                {o.first_name ? `${o.first_name} ${o.last_name ?? ''}` : o.name ?? `#${o.id}`}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {o.phone && `Phone: ${o.phone}`}
                                {o.phone && o.email && ' • '}
                                {o.email && `Email: ${o.email}`}
                                {!o.phone && !o.email && 'No contact info'}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}