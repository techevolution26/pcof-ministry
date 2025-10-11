// src/components/MemberTypeahead.tsx
'use client'
import React, { useEffect, useRef, useState } from 'react'
import { searchMembersByQuery } from '@/lib/adminApi'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faSearch,
    faUser,
    faIdCard,
    faEnvelope,
    faTimes,
    faSpinner,
    faUsers
} from '@fortawesome/free-solid-svg-icons'

type Member = {
    id: number;
    first_name?: string;
    last_name?: string;
    member_number?: string;
    email?: string;
    phone?: string;
    church?: { name: string };
}

type Props = {
    value?: number | string | null
    onSelect: (member: Member | null) => void
    placeholder?: string
    required?: boolean
    className?: string
    churchId?: string | number | null
    disabled?: boolean
}

export default function MemberTypeahead({
    value,
    onSelect,
    placeholder = 'Search members by name, email, or member number...',
    required = false,
    className = '',
    churchId = undefined,
    disabled = false,
}: Props) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<Member[]>([])
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selected, setSelected] = useState<Member | null>(null)
    const [hasSearched, setHasSearched] = useState(false)
    const timerRef = useRef<number | null>(null)
    const rootRef = useRef<HTMLDivElement | null>(null)
    const inputRef = useRef<HTMLInputElement | null>(null)

    // Initialize from value prop
    useEffect(() => {
        if (!value) {
            setSelected(null);
            setQuery('');
            return
        }
        // If we have a value but no selected member, we could fetch the member details here
        // For now, we'll just clear the selection if value is reset
    }, [value])

    // Close dropdown when clicking outside
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

    // Handle keyboard navigation
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (!open) return

            const items = Array.from(rootRef.current?.querySelectorAll('[role="option"]') || [])
            const currentIndex = items.findIndex(item => item === document.activeElement)

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault()
                    const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
                        ; (items[nextIndex] as HTMLElement)?.focus()
                    break
                case 'ArrowUp':
                    e.preventDefault()
                    const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
                        ; (items[prevIndex] as HTMLElement)?.focus()
                    break
                case 'Escape':
                    setOpen(false)
                    inputRef.current?.focus()
                    break
                case 'Enter':
                    if (document.activeElement?.getAttribute('role') === 'option') {
                        ; (document.activeElement as HTMLElement)?.click()
                    }
                    break
            }
        }

        if (open) {
            document.addEventListener('keydown', handleKeyDown)
        }

        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [open])

    async function doSearch(q: string) {
        if (!q || q.trim().length < 1) {
            setResults([])
            setOpen(false)
            setHasSearched(false)
            return
        }

        setLoading(true)
        setHasSearched(true)
        try {
            const r = await searchMembersByQuery(q.trim(), 10, churchId)
            const members = Array.isArray(r) ? r : (r?.data ?? [])
            setResults(members)
            setOpen(members.length > 0)
        } catch (err) {
            console.error('Member search failed', err)
            setResults([])
            setOpen(false)
        } finally {
            setLoading(false)
        }
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const v = e.target.value
        setQuery(v)

        // Clear previous timeout
        if (timerRef.current) window.clearTimeout(timerRef.current)

        // Set new timeout for search
        timerRef.current = window.setTimeout(() => doSearch(v), 300)
    }

    function handleSelect(m: Member) {
        setSelected(m)
        setQuery(`${m.first_name ?? ''} ${m.last_name ?? ''}`.trim() || m.member_number || m.email || String(m.id))
        setOpen(false)
        setHasSearched(false)
        onSelect(m)
    }

    function clearSelection() {
        setSelected(null)
        setQuery('')
        setResults([])
        setHasSearched(false)
        onSelect(null)
        inputRef.current?.focus()
    }

    function handleFocus() {
        if (results.length > 0 && query.length > 0) {
            setOpen(true)
        }
    }

    const getMemberDisplayName = (member: Member) => {
        const name = `${member.first_name ?? ''} ${member.last_name ?? ''}`.trim()
        if (name && member.member_number) {
            return `${name} (${member.member_number})`
        }
        return name || member.member_number || member.email || `Member #${member.id}`
    }

    const getMemberSecondaryInfo = (member: Member) => {
        const parts = []
        if (member.email) parts.push(member.email)
        if (member.phone) parts.push(member.phone)
        if (member.church?.name) parts.push(member.church.name)
        return parts.join(' • ')
    }

    return (
        <div ref={rootRef} className={`relative ${className}`}>
            {/* Input Container */}
            <div className="relative">
                <FontAwesomeIcon
                    icon={loading ? faSpinner : faSearch}
                    className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10 ${loading ? 'animate-spin' : ''
                        }`}
                />

                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    placeholder={placeholder}
                    required={required && !selected}
                    disabled={disabled}
                    className={`w-full pl-12 pr-10 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400 transition-all duration-200 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300 dark:hover:border-gray-500'
                        } ${open ? 'rounded-b-none border-b-0' : ''}`}
                    aria-autocomplete="list"
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    role="combobox"
                    aria-controls="member-search-results"
                />

                {/* Clear Button */}
                {query && !loading && (
                    <button
                        type="button"
                        onClick={clearSelection}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                        aria-label="Clear search"
                    >
                        <FontAwesomeIcon icon={faTimes} className="text-sm" />
                    </button>
                )}
            </div>

            {/* Dropdown Results */}
            {open && (
                <div
                    id="member-search-results"
                    className="absolute z-50 mt-0 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 border-t-0 rounded-b-xl shadow-2xl max-h-80 overflow-auto"
                    role="listbox"
                    aria-label="Search results"
                >
                    {/* Loading State */}
                    {loading && (
                        <div className="flex items-center gap-3 p-4 text-sm text-gray-500 dark:text-gray-400">
                            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                            <span>Searching members...</span>
                        </div>
                    )}

                    {/* No Results State */}
                    {!loading && hasSearched && results.length === 0 && (
                        <div className="text-center py-8">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                <FontAwesomeIcon icon={faUsers} className="text-gray-400 text-xl" />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No members found</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs mx-auto">
                                Try searching by name, email, or member number
                            </p>
                        </div>
                    )}

                    {/* Results List */}
                    {!loading && results.map((member, index) => (
                        <button
                            key={member.id}
                            type="button"
                            onClick={() => handleSelect(member)}
                            className="w-full text-left p-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-b border-gray-100 dark:border-gray-600 last:border-b-0 transition-colors duration-150 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20"
                            role="option"
                            aria-selected={selected?.id === member.id}
                            tabIndex={0}
                        >
                            <div className="flex items-start gap-3">
                                {/* Avatar */}
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                                    <FontAwesomeIcon icon={faUser} className="text-white text-sm" />
                                </div>

                                {/* Member Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                                            {getMemberDisplayName(member)}
                                        </div>
                                        {member.member_number && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium">
                                                <FontAwesomeIcon icon={faIdCard} className="text-xs" />
                                                {member.member_number}
                                            </span>
                                        )}
                                    </div>

                                    {/* Secondary Info */}
                                    {getMemberSecondaryInfo(member) && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 flex-wrap">
                                            {member.email && (
                                                <span className="flex items-center gap-1 truncate">
                                                    <FontAwesomeIcon icon={faEnvelope} className="text-xs" />
                                                    {member.email}
                                                </span>
                                            )}
                                            {member.phone && (
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                    {member.phone}
                                                </span>
                                            )}
                                            {member.church?.name && (
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                    </svg>
                                                    {member.church.name}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Member ID (always show) */}
                                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                        ID: {member.id}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}

                    {/* Search Hint */}
                    {!loading && results.length > 0 && (
                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-600/50 border-t border-gray-100 dark:border-gray-600">
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
                                <span>↑↓ to navigate • Enter to select • Esc to close</span>
                                <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Selected Member Badge (Alternative Display) */}
            {selected && !open && (
                <div className="mt-2 flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FontAwesomeIcon icon={faUser} className="text-white text-xs" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                            {getMemberDisplayName(selected)}
                        </div>
                        {getMemberSecondaryInfo(selected) && (
                            <div className="text-xs text-blue-700 dark:text-blue-300 truncate">
                                {getMemberSecondaryInfo(selected)}
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={clearSelection}
                        className="w-6 h-6 flex items-center justify-center text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors duration-200"
                        aria-label="Remove selected member"
                    >
                        <FontAwesomeIcon icon={faTimes} className="text-sm" />
                    </button>
                </div>
            )}

            {/* Helper Text */}
            {!selected && !open && (
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <FontAwesomeIcon icon={faSearch} className="text-xs" />
                    <span>Start typing to search for members</span>
                </div>
            )}
        </div>
    )
}