'use client'
import React, { useEffect, useRef, useState } from 'react'
import { fetchPublicChurches } from '@/lib/adminApi'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChurch, faSearch, faSpinner } from '@fortawesome/free-solid-svg-icons'

type Props = {
    value?: string | number | ''
    onSelect: (church: any | null) => void
    placeholder?: string
}

export default function ChurchTypeahead({ value, onSelect, placeholder }: Props) {
    const [q, setQ] = useState('')
    const [items, setItems] = useState<any[]>([])
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const timer = useRef<number | null>(null)

    useEffect(() => {
        if (!value) return
        let mounted = true
            ; (async () => {
                try {
                    const c = await fetchPublicChurches({ limit: 1 })
                    if (!mounted) return
                } catch (err) { /* ignore */ }
            })()
        return () => { mounted = false }
    }, [value])

    async function doSearch(qs: string) {
        setLoading(true)
        try {
            const resp = await fetchPublicChurches({ q: qs, limit: 10 })
            setItems(resp)
            setOpen(true)
        } catch (err) {
            setItems([])
            setOpen(false)
        } finally {
            setLoading(false)
        }
    }

    function onInput(e: React.ChangeEvent<HTMLInputElement>) {
        const v = e.target.value
        setQ(v)
        if (timer.current) window.clearTimeout(timer.current)

        timer.current = window.setTimeout(() => {
            if (v.trim().length === 0) {
                setItems([])
                setOpen(false)
                return
            }
            doSearch(v.trim())
        }, 300)
    }

    function doSelect(item: any) {
        setQ(item.name)
        setOpen(false)
        onSelect(item)
    }

    function clearSelection() {
        setQ('')
        setOpen(false)
        onSelect(null)
    }

    return (
        <div className="relative">
            <div className="relative">
                <FontAwesomeIcon
                    icon={faSearch}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"
                />
                <input
                    type="text"
                    value={q}
                    onChange={onInput}
                    onFocus={() => q && doSearch(q)}
                    placeholder={placeholder ?? 'Search churches by name...'}
                    className="w-full pl-12 pr-12 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    aria-autocomplete="list"
                />
                {loading && (
                    <FontAwesomeIcon
                        icon={faSpinner}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm animate-spin"
                    />
                )}
                {q && !loading && (
                    <button
                        onClick={clearSelection}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        ×
                    </button>
                )}
            </div>

            {open && items.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                    <ul className="max-h-64 overflow-auto">
                        {items.map(i => (
                            <li
                                key={i.id}
                                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                                onClick={() => doSelect(i)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FontAwesomeIcon icon={faChurch} className="text-white text-sm" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-gray-900 dark:text-white truncate">
                                            {i.name}
                                        </div>
                                        {i.branch && (
                                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                {i.branch}
                                            </div>
                                        )}
                                        {i.address && (
                                            <div className="text-xs text-gray-400 dark:text-gray-500 truncate mt-1">
                                                {i.address}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {open && items.length === 0 && q && !loading && (
                <div className="absolute z-50 left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-4">
                    <div className="text-center text-gray-500 dark:text-gray-400">
                        <FontAwesomeIcon icon={faChurch} className="text-gray-300 text-xl mb-2" />
                        <div className="text-sm">No churches found matching "{q}"</div>
                        <div className="text-xs mt-1">Try a different search term</div>
                    </div>
                </div>
            )}
        </div>
    )
}